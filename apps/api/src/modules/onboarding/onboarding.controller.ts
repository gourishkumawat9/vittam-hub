import { Body, Controller, Delete, Get, Patch, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { saveOnboardingDraftInputSchema, type SaveOnboardingDraftInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { OnboardingService } from "./onboarding.service";

@ApiTags("onboarding")
@Controller("v1/onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("state")
  @ApiOperation({ summary: "Get the caller's onboarding progress and saved draft" })
  getState(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getState(user.sub, user.role);
  }

  @Get("strength")
  @ApiOperation({ summary: "How complete the caller's profile is, and the questions still to answer" })
  getStrength(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getStrength(user.sub, user.role);
  }

  @Patch("draft")
  @UsePipes(new ZodValidationPipe(saveOnboardingDraftInputSchema))
  @ApiOperation({ summary: "Autosave one wizard section into the onboarding draft" })
  saveDraft(@CurrentUser() user: AuthenticatedUser, @Body() input: SaveOnboardingDraftInput) {
    return this.onboardingService.saveDraft(user.sub, user.role, input);
  }

  @Delete("draft")
  @ApiOperation({ summary: "Discard unsaved wizard edits to a profile that is already published" })
  discardEdits(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.discardEdits(user.sub);
  }

  @Post("publish")
  @ApiOperation({ summary: "Validate the complete draft and publish the role-specific profile" })
  publish(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    return this.onboardingService.publish(user.sub, user.role, body);
  }
}
