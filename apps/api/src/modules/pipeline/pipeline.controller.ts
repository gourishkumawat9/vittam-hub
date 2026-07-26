import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  addToPipelineInputSchema,
  passStartupInputSchema,
  updatePipelineEntryInputSchema,
  type AddToPipelineInput,
  type PassStartupInput,
  type UpdatePipelineEntryInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { MatchScoreService } from "../investors/match-score.service";
import { TrustScoreService } from "../startups/trust-score.service";

import { PipelineService } from "./pipeline.service";

@ApiTags("pipeline")
@Controller("v1/pipeline")
@Roles("INVESTOR")
export class PipelineController {
  constructor(
    private readonly pipelineService: PipelineService,
    private readonly trustScoreService: TrustScoreService,
    private readonly matchScoreService: MatchScoreService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's investment pipeline (Kanban board rows) — each card enriched with Trust Score + Match %, same scoring every other surface uses" })
  async list(@CurrentUser() user: AuthenticatedUser) {
    const entries = await this.pipelineService.listForInvestor(user.sub);
    const matchByStartup = await this.matchScoreService.scoreManyForInvestor(
      user.sub,
      entries.map((e) => e.startup),
    );
    return Promise.all(
      entries.map(async (entry) => {
        const trustScore = await this.trustScoreService.calculate(entry.startupId);
        return {
          ...entry,
          trustScore: { score: trustScore.score, band: trustScore.band },
          matchScore: matchByStartup.get(entry.startupId) ?? null,
        };
      }),
    );
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

  @Patch(":id/pass")
  @UsePipes(new ZodValidationPipe(passStartupInputSchema))
  @ApiOperation({ summary: "Pass on a startup — requires a structured reason, never a bare status flip (Investor Workspace §7)" })
  pass(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: PassStartupInput) {
    return this.pipelineService.pass(user.sub, id, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a startup from the caller's pipeline" })
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.pipelineService.removeEntry(user.sub, id);
  }
}
