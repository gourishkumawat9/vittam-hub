import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
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

  /**
   * Billing isn't switched on yet (CLAUDE.md §5), so an unconfigured server answers 503 rather than
   * crashing with a 500, and a body whose signature doesn't check out is a 400, never processed.
   */
  constructEvent(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!this.stripe || !webhookSecret) throw new ServiceUnavailableException("Billing is not enabled");
    if (!Buffer.isBuffer(rawBody)) throw new BadRequestException("Invalid webhook body");
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException("Invalid webhook signature");
    }
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
