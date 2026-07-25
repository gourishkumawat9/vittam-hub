import { Body, Controller, Get, Param, Post, Query, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createRelationshipClaimInputSchema,
  relationshipClaimListFiltersSchema,
  respondToRelationshipClaimInputSchema,
  type CreateRelationshipClaimInput,
  type RelationshipClaimListFilters,
  type RespondToRelationshipClaimInput,
} from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { RelationshipClaimsService } from "./relationship-claims.service";

@ApiTags("relationship-claims")
@Controller("v1/relationship-claims")
export class RelationshipClaimsController {
  constructor(private readonly relationshipClaims: RelationshipClaimsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(relationshipClaimListFiltersSchema))
  @ApiOperation({ summary: "List the caller's own relationship claims — sent (as claimant) and received (as target)" })
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() filters: RelationshipClaimListFilters) {
    return this.relationshipClaims.listMine(user.sub, user.role, filters);
  }

  @Post()
  @Roles("FOUNDER", "INVESTOR", "INCUBATOR", "UNIVERSITY")
  @UsePipes(new ZodValidationPipe(createRelationshipClaimInputSchema))
  @ApiOperation({ summary: "Claim a relationship with another profile (e.g. 'we invested in this startup') — pending until the other side confirms" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateRelationshipClaimInput) {
    return this.relationshipClaims.create(user.sub, user.role, input);
  }

  @Post(":id/respond")
  @UsePipes(new ZodValidationPipe(respondToRelationshipClaimInputSchema))
  @ApiOperation({ summary: "Confirm or deny a relationship claim made about you — only the claimed-about party can respond" })
  respond(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: RespondToRelationshipClaimInput) {
    return this.relationshipClaims.respond(id, user.sub, input.action);
  }
}
