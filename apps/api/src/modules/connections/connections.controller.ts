import { Body, Controller, Get, Param, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  connectionListFiltersSchema,
  createConnectionInputSchema,
  createMessageInputSchema,
  respondToConnectionInputSchema,
  scheduleMeetingInputSchema,
  type ConnectionListFilters,
  type CreateConnectionInput,
  type CreateMessageInput,
  type RespondToConnectionInput,
  type ScheduleMeetingInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { ConnectionsService } from "./connections.service";

@ApiTags("connections")
@Controller("v1/connections")
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(connectionListFiltersSchema))
  @ApiOperation({ summary: "List the caller's sent and received connect requests, optionally filtered by status" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() filters: ConnectionListFilters) {
    return this.connectionsService.listForUser(user.sub, filters);
  }

  @Get("quota")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Get the caller's remaining monthly connect-request quota" })
  quota(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.getQuota(user.sub);
  }

  @Get("meetings")
  @ApiOperation({ summary: "List every meeting across all of the caller's connections" })
  listMyMeetings(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.listMyMeetings(user.sub);
  }

  @Post()
  @Roles("FOUNDER")
  @UsePipes(new ZodValidationPipe(createConnectionInputSchema))
  @ApiOperation({ summary: "Send a Connect Request to an investor (never direct messaging)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateConnectionInput) {
    return this.connectionsService.create(user.sub, input);
  }

  @Post(":id/respond")
  @Roles("INVESTOR")
  @UsePipes(new ZodValidationPipe(respondToConnectionInputSchema))
  @ApiOperation({ summary: "Accept, decline, or ignore a received connect request" })
  respond(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: RespondToConnectionInput) {
    return this.connectionsService.respond(id, user.sub, input.action);
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "List messages in a connection's thread (accepted connections only)" })
  listMessages(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.connectionsService.listMessages(id, user.sub);
  }

  @Post(":id/messages")
  @UsePipes(new ZodValidationPipe(createMessageInputSchema))
  @ApiOperation({ summary: "Send a message in an accepted connection's thread" })
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: CreateMessageInput) {
    return this.connectionsService.sendMessage(id, user.sub, input);
  }

  @Post(":id/request-info")
  @Roles("INVESTOR")
  @ApiOperation({ summary: "Ask the founder for more information before deciding (doesn't change status)" })
  requestInfo(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.connectionsService.requestMoreInfo(id, user.sub);
  }

  @Get(":id/meetings")
  @ApiOperation({ summary: "List proposed/scheduled meeting times for a connection" })
  listMeetings(@Param("id") id: string) {
    return this.connectionsService.listMeetings(id);
  }

  @Post(":id/meetings")
  @UsePipes(new ZodValidationPipe(scheduleMeetingInputSchema))
  @ApiOperation({ summary: "Propose a meeting time — allowed before acceptance too" })
  scheduleMeeting(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: ScheduleMeetingInput) {
    return this.connectionsService.scheduleMeeting(id, user.sub, input);
  }
}
