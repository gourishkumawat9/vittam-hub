import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, UseGuards, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { runVerificationCheckInputSchema, verifiableEntityTypeSchema, type RunVerificationCheckInput } from "@vittamhub/types";
import { z } from "zod";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ACCOUNT_THROTTLER, UserThrottlerGuard } from "../../common/guards/user-throttler.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { PhoneVerificationService } from "./phone-verification.service";
import { VerificationOrchestratorService } from "./verification-orchestrator.service";

const confirmPhoneOtpSchema = z.object({ code: z.string().length(6) });
type ConfirmPhoneOtpInput = z.infer<typeof confirmPhoneOtpSchema>;

@ApiTags("verification")
@Controller("v1/verification")
export class VerificationController {
  constructor(
    private readonly orchestrator: VerificationOrchestratorService,
    private readonly phoneVerification: PhoneVerificationService,
  ) {}

  @Post("phone/request")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Send a one-time code to the caller's phone number on file" })
  requestPhoneOtp(@CurrentUser() user: AuthenticatedUser) {
    return this.phoneVerification.request(user.sub);
  }

  @Post("phone/confirm")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(confirmPhoneOtpSchema))
  @ApiOperation({ summary: "Confirm the one-time code sent to the caller's phone — marks it V2-verified on success" })
  confirmPhoneOtp(@CurrentUser() user: AuthenticatedUser, @Body() input: ConfirmPhoneOtpInput) {
    return this.phoneVerification.confirm(user.sub, input.code);
  }

  @Post("checks")
  @UseGuards(UserThrottlerGuard)
  @Throttle({ [ACCOUNT_THROTTLER]: { limit: 20, ttl: 60 * 60_000 } })
  @UsePipes(new ZodValidationPipe(runVerificationCheckInputSchema))
  @ApiOperation({ summary: "Run an automated verification check against the caller's own profile (e.g. work-domain email, or a registry lookup once configured)" })
  runCheck(@CurrentUser() user: AuthenticatedUser, @Body() input: RunVerificationCheckInput) {
    return this.orchestrator.runCheck(user.sub, input.entityType, input.entityId, input.field, input.method, input.input);
  }

  @Get(":entityType/:entityId")
  @ApiOperation({ summary: "List the verification ledger for a profile — the audit trail behind its badges (raw provider responses are owner-only)" })
  getRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Param("entityType") entityType: string,
    @Param("entityId", ParseUUIDPipe) entityId: string,
  ) {
    // A path segment is whatever the caller typed; only the known profile types have a ledger.
    const parsedType = verifiableEntityTypeSchema.safeParse(entityType);
    if (!parsedType.success) throw new NotFoundException("Profile not found");
    return this.orchestrator.getRecords(parsedType.data, entityId, user.sub);
  }
}
