import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";

import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

import { MediaService } from "./media.service";

const uploadUrlRequestSchema = z.object({
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
  folder: z.enum(["logos", "avatars", "documents", "resumes"]),
});
type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

@ApiTags("media")
@Controller("v1/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload-url")
  @UsePipes(new ZodValidationPipe(uploadUrlRequestSchema))
  @ApiOperation({ summary: "Get a short-lived pre-signed URL for direct-to-storage upload" })
  createUploadUrl(@Body() body: UploadUrlRequest) {
    return this.mediaService.createUploadUrl(body.mimeType, body.folder);
  }
}
