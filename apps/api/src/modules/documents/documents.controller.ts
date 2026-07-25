import { Body, Controller, Delete, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { createDocumentGrantInputSchema, documentUploadInputSchema, type CreateDocumentGrantInput, type DocumentUploadInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { DocumentAccessService } from "./document-access.service";
import { DocumentsService } from "./documents.service";

@ApiTags("documents")
@Controller("v1/documents")
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentAccess: DocumentAccessService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's own private documents" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listForUser(user.sub);
  }

  @Get("shared-with-me")
  @ApiOperation({ summary: "Documents currently shared with the caller (permissioned data room), not yet expired or revoked" })
  listSharedWithMe(@CurrentUser() user: AuthenticatedUser) {
    return this.documentAccess.listSharedWithMe(user.sub);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(documentUploadInputSchema))
  @ApiOperation({ summary: "Record a document already uploaded via a presigned URL (see /v1/media/upload-url)" })
  upload(@CurrentUser() user: AuthenticatedUser, @Body() input: DocumentUploadInput) {
    return this.documentsService.upload(user.sub, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete one of the caller's own documents" })
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.documentsService.remove(user.sub, id);
  }

  @Get(":id/access")
  @ApiOperation({ summary: "Check access to a gated document and, if allowed, return the file — the only path anyone should read a gated document through (logs the view)" })
  access(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.documentAccess.access(user.sub, id);
  }

  @Get(":id/grants")
  @ApiOperation({ summary: "List who has access to one of the caller's documents, with view counts (Bundle 21 view log)" })
  listGrants(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.documentAccess.listGrantsWithViews(user.sub, id);
  }

  @Post(":id/grants")
  @UsePipes(new ZodValidationPipe(createDocumentGrantInputSchema))
  @ApiOperation({ summary: "Grant another user access to one of the caller's documents — default 14-day expiry, optional NDA gate" })
  grant(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() input: CreateDocumentGrantInput) {
    return this.documentAccess.grant(user.sub, id, input);
  }

  @Delete("grants/:grantId")
  @ApiOperation({ summary: "Revoke a previously granted document access" })
  revokeGrant(@CurrentUser() user: AuthenticatedUser, @Param("grantId") grantId: string) {
    return this.documentAccess.revoke(user.sub, grantId);
  }

  @Post("grants/:grantId/accept-nda")
  @ApiOperation({ summary: "Accept the NDA required by a document grant, unlocking access to it" })
  acceptNda(@CurrentUser() user: AuthenticatedUser, @Param("grantId") grantId: string) {
    return this.documentAccess.acceptNda(user.sub, grantId);
  }
}
