import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createConnectionInputSchema,
  createMessageInputSchema,
  respondToConnectionInputSchema,
  type CreateConnectionInput,
  type CreateMessageInput,
  type RespondToConnectionInput,
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
  @ApiOperation({ summary: "List the caller's sent and received connect requests" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.listForUser(user.sub);
  }

  @Get("quota")
  @Roles("FOUNDER")
  @ApiOperation({ summary: "Get the caller's remaining monthly connect-request quota" })
  quota(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.getQuota(user.sub);
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
}
