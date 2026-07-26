import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";

import { WatchlistTriggerEvaluatorService } from "./watchlist-trigger-evaluator.service";
import { WatchlistTriggerSchedulerService } from "./watchlist-trigger-scheduler.service";
import { WATCHLIST_TRIGGER_QUEUE_NAME } from "./watchlist-trigger.constants";
import { WatchlistTriggerProcessor } from "./watchlist-trigger.processor";
import { WatchlistTriggersService } from "./watchlist-triggers.service";
import { WatchlistController } from "./watchlist.controller";
import { WatchlistService } from "./watchlist.service";

@Module({
  imports: [NotificationsModule, BullModule.registerQueue({ name: WATCHLIST_TRIGGER_QUEUE_NAME })],
  controllers: [WatchlistController],
  providers: [
    WatchlistService,
    WatchlistTriggersService,
    WatchlistTriggerEvaluatorService,
    WatchlistTriggerSchedulerService,
    WatchlistTriggerProcessor,
  ],
  exports: [WatchlistService, WatchlistTriggersService],
})
export class WatchlistModule {}
