import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { WorkspaceDashboardService } from "./workspace-dashboard.service";

@ApiTags("investor-workspace")
@Controller("v1/workspace")
@Roles("INVESTOR")
export class WorkspaceController {
  constructor(private readonly dashboardService: WorkspaceDashboardService) {}

  @Get("home")
  @ApiOperation({ summary: "Dashboard Home — the single composed call for the Investor Workspace's landing screen" })
  home(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getHome(user.sub);
  }
}
