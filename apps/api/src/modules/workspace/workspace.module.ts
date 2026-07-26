import { Module } from "@nestjs/common";

import { InvestorsModule } from "../investors/investors.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PipelineModule } from "../pipeline/pipeline.module";
import { WatchlistModule } from "../watchlist/watchlist.module";

import { WorkspaceDashboardService } from "./workspace-dashboard.service";
import { WorkspaceController } from "./workspace.controller";

// Pure composition layer — imports the modules it reads from, adds nothing
// to the domain model. See WorkspaceDashboardService for why.
@Module({
  imports: [InvestorsModule, PipelineModule, WatchlistModule, NotificationsModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceDashboardService],
})
export class WorkspaceModule {}
