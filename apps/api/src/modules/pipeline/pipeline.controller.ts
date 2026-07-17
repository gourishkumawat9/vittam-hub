import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  addToPipelineInputSchema,
  updatePipelineEntryInputSchema,
  type AddToPipelineInput,
  type UpdatePipelineEntryInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { PipelineService } from "./pipeline.service";

@ApiTags("pipeline")
@Controller("v1/pipeline")
@Roles("INVESTOR")
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's investment pipeline (Kanban board rows)" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.pipelineService.listForInvestor(user.sub);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(addToPipelineInputSchema))
  @ApiOperation({ summary: "Add a startup to the caller's pipeline" })
  add(@CurrentUser() user: AuthenticatedUser, @Body() input: AddToPipelineInput) {
    return this.pipelineService.addToPipeline(user.sub, input);
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(updatePipelineEntryInputSchema))
  @ApiOperation({ summary: "Move a pipeline entry to a new stage (drag-and-drop) or edit its notes" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: UpdatePipelineEntryInput) {
    return this.pipelineService.updateEntry(user.sub, id, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a startup from the caller's pipeline" })
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.pipelineService.removeEntry(user.sub, id);
  }
}
