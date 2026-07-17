import { Body, Controller, Delete, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { documentUploadInputSchema, type DocumentUploadInput } from "@vittamhub/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../../common/types/authenticated-user";

import { DocumentsService } from "./documents.service";

@ApiTags("documents")
@Controller("v1/documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's own private documents" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listForUser(user.sub);
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
}
