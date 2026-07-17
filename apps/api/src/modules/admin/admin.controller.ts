import { Body, Controller, Get, Param, Patch, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  adminUserListFiltersSchema,
  signupsFiltersSchema,
  SubscriptionPlan,
  updatePlanLimitInputSchema,
  type AdminUserListFilters,
  type SignupsFilters,
  type UpdatePlanLimitInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { PlanLimitsService } from "../plan-limits/plan-limits.service";

import { AdminService } from "./admin.service";
import { PlatformAnalyticsService } from "./platform-analytics.service";

@ApiTags("admin")
@Controller("v1/admin")
@Roles("ADMIN")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly planLimitsService: PlanLimitsService,
    private readonly platformAnalyticsService: PlatformAnalyticsService,
  ) {}

  @Get("verification-overview")
  @ApiOperation({ summary: "Read-only verification-status counts + pending lists across every profile type (no approve/reject — status is fully automated, see modules/verification)" })
  verificationOverview() {
    return this.adminService.getVerificationOverview();
  }

  @Get("plan-limits")
  @ApiOperation({ summary: "List the configurable connect-request quota for every plan" })
  listPlanLimits() {
    return this.planLimitsService.listAll();
  }

  @Patch("plan-limits/:plan")
  @UsePipes(new ZodValidationPipe(updatePlanLimitInputSchema))
  @ApiOperation({ summary: "Set a plan's monthly connect-request limit (null = unlimited)" })
  updatePlanLimit(@CurrentUser() admin: AuthenticatedUser, @Param("plan") plan: SubscriptionPlan, @Body() input: UpdatePlanLimitInput) {
    return this.planLimitsService.upsert(plan, input.monthlyConnectRequestLimit, admin.sub);
  }

  @Get("analytics/totals")
  @ApiOperation({ summary: "Platform-wide totals — users, startups, investors, connections" })
  getTotals() {
    return this.platformAnalyticsService.getTotals();
  }

  @Get("analytics/signups")
  @UsePipes(new ZodValidationPipe(signupsFiltersSchema))
  @ApiOperation({ summary: "Signups bucketed by week or month" })
  getSignups(@Query() filters: SignupsFilters) {
    return this.platformAnalyticsService.getSignupsOverTime(filters);
  }

  @Get("analytics/connection-acceptance-rate")
  @ApiOperation({ summary: "Platform-wide connect-request acceptance rate" })
  getConnectionAcceptanceRate() {
    return this.platformAnalyticsService.getConnectionAcceptanceRate();
  }

  @Get("analytics/verification-funnel")
  @ApiOperation({ summary: "Startup verification funnel (UNVERIFIED → PENDING → VERIFIED, REJECTED as a side branch)" })
  getVerificationFunnel() {
    return this.platformAnalyticsService.getVerificationFunnel();
  }

  @Get("users")
  @UsePipes(new ZodValidationPipe(adminUserListFiltersSchema))
  @ApiOperation({ summary: "Read-only user list/search — no ban/edit/role-change action here (CLAUDE.md §6: no manual gatekeeping)" })
  listUsers(@Query() filters: AdminUserListFilters) {
    return this.platformAnalyticsService.listUsers(filters);
  }
}
