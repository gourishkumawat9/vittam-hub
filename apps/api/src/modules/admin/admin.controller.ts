import { Body, Controller, Get, Param, Patch, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionPlan, updatePlanLimitInputSchema, VerificationStatus, type UpdatePlanLimitInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { PlanLimitsService } from "../plan-limits/plan-limits.service";

import { AdminService } from "./admin.service";

@ApiTags("admin")
@Controller("v1/admin")
@Roles("ADMIN")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  @Get("startups/verification-queue")
  @ApiOperation({ summary: "List startups awaiting verification review" })
  verificationQueue() {
    return this.adminService.listVerificationQueue();
  }

  @Patch("startups/:id/verification")
  @ApiOperation({ summary: "Approve or reject a startup's verification" })
  setVerification(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id") id: string,
    @Body("status") status: VerificationStatus,
  ) {
    return this.adminService.setStartupVerification(admin.sub, id, status);
  }

  @Get("plan-limits")
  @ApiOperation({ summary: "List the configurable connect-request quota for every plan" })
  listPlanLimits() {
    return this.planLimitsService.listAll();
  }

  @Patch("plan-limits/:plan")
  @UsePipes(new ZodValidationPipe(updatePlanLimitInputSchema))
  @ApiOperation({ summary: "Set a plan's monthly connect-request limit (null = unlimited)" })
  updatePlanLimit(@Param("plan") plan: SubscriptionPlan, @Body() input: UpdatePlanLimitInput) {
    return this.planLimitsService.upsert(plan, input.monthlyConnectRequestLimit);
  }
}
