import { Body, Controller, Post, UseGuards, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserThrottlerGuard } from "../../common/guards/user-throttler.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";

import { MediaService } from "./media.service";

const uploadUrlRequestSchema = z.object({
  mimeType: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx — cap tables
    "application/vnd.ms-excel", // legacy .xls
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx — contracts, notes
    "text/csv",
  ]),
  folder: z.enum(["logos", "avatars", "documents", "resumes"]),
});
type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

@ApiTags("media")
@Controller("v1/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Every link issued here lets its holder store one file of up to 20 MB, so
   * the hourly cap is what keeps an account (or a script signed in as one)
   * from filling the storage bucket. A whole onboarding uses about a dozen.
   */
  @Post("upload-url")
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60 * 60_000 } })
  @UsePipes(new ZodValidationPipe(uploadUrlRequestSchema))
  @ApiOperation({ summary: "Get a short-lived pre-signed URL for direct-to-storage upload" })
  createUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() body: UploadUrlRequest) {
    return this.mediaService.createUploadUrl(body.mimeType, body.folder, user.sub);
  }
}
