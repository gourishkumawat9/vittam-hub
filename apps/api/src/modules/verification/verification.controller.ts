import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { runVerificationCheckInputSchema, type RunVerificationCheckInput, type VerifiableEntityType } from "@vittamhub/types";
import { z } from "zod";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
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
  @ApiOperation({ summary: "Send a one-time code to the caller's phone number on file" })
  requestPhoneOtp(@CurrentUser() user: AuthenticatedUser) {
    return this.phoneVerification.request(user.sub);
  }

  @Post("phone/confirm")
  @UsePipes(new ZodValidationPipe(confirmPhoneOtpSchema))
  @ApiOperation({ summary: "Confirm the one-time code sent to the caller's phone — marks it V2-verified on success" })
  confirmPhoneOtp(@CurrentUser() user: AuthenticatedUser, @Body() input: ConfirmPhoneOtpInput) {
    return this.phoneVerification.confirm(user.sub, input.code);
  }

  @Post("checks")
  @UsePipes(new ZodValidationPipe(runVerificationCheckInputSchema))
  @ApiOperation({ summary: "Run an automated verification check against the caller's own profile (e.g. work-domain email, or a registry lookup once configured)" })
  runCheck(@CurrentUser() user: AuthenticatedUser, @Body() input: RunVerificationCheckInput) {
    return this.orchestrator.runCheck(user.sub, input.entityType, input.entityId, input.field, input.method, input.input);
  }

  @Get(":entityType/:entityId")
  @ApiOperation({ summary: "List the verification ledger for a profile — the audit trail behind its badges" })
  getRecords(@Param("entityType") entityType: VerifiableEntityType, @Param("entityId") entityId: string) {
    return this.orchestrator.getRecords(entityType, entityId);
  }
}
