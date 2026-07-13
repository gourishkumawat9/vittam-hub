import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Constructed lazily/nullably — a Stripe SDK instance validates its key
    // eagerly, so building one unconditionally would crash the entire app at
    // boot in any environment that hasn't configured billing yet (every
    // other optional integration in this codebase follows the same pattern).
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" }) : null;
  }

  constructEvent(rawBody: Buffer, signature: string) {
    if (!this.stripe) throw new Error("STRIPE_SECRET_KEY is not configured");
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.configService.getOrThrow("STRIPE_WEBHOOK_SECRET"),
    );
  }

  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscription(subscription);
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }
}
