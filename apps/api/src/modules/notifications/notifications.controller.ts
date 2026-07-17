import { Controller, Get, Patch, Param, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { notificationListFiltersSchema, type NotificationListFilters } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("v1/notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(notificationListFiltersSchema))
  @ApiOperation({ summary: "List the caller's notifications, newest first" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() filters: NotificationListFilters) {
    return this.notificationsService.listForUser(user.sub, filters);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get the caller's unread notification count (poll this for the dashboard bell badge)" })
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark every one of the caller's notifications as read" })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notificationsService.markRead(id, user.sub);
  }
}
