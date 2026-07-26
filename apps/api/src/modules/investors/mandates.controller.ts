import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { createMandateInputSchema, updateMandateInputSchema, type CreateMandateInput, type UpdateMandateInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { MandatesService } from "./mandates.service";

@ApiTags("investor-workspace")
@Controller("v1/investors/me/mandates")
@Roles("INVESTOR")
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's investment mandates" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.mandatesService.listMine(user.sub);
  }

  @Post()
  @ApiOperation({ summary: "Create a new investment mandate — a named, reusable thesis producing its own match stream" })
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createMandateInputSchema)) input: CreateMandateInput) {
    return this.mandatesService.create(user.sub, input);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a mandate" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateMandateInputSchema)) input: UpdateMandateInput,
  ) {
    return this.mandatesService.update(user.sub, id, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a mandate" })
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.mandatesService.remove(user.sub, id);
  }

  @Get(":id/matches")
  @ApiOperation({ summary: "The match stream this mandate currently produces — ranked by the same deterministic fit score as regular discovery" })
  matches(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query("limit") limit?: string) {
    return this.mandatesService.matches(user.sub, id, limit ? Number(limit) : undefined);
  }
}
