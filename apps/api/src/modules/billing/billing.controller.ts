import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import { Request } from "express";

import { Public } from "../../common/decorators/public.decorator";

import { BillingService } from "./billing.service";

@Controller("v1/billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Stripe requires the exact raw request bytes to verify the webhook
   * signature — main.ts registers `express.raw()` for this one path only
   * (JSON body parsing would corrupt Stripe's signature check).
   */
  @Public()
  @Post("webhook")
  @ApiExcludeEndpoint()
  async webhook(@Req() req: Request, @Headers("stripe-signature") signature: string) {
    if (!signature) throw new BadRequestException("Missing Stripe-Signature header");
    const event = this.billingService.constructEvent(req.body as Buffer, signature);
    await this.billingService.handleEvent(event);
    return { received: true };
  }
}
