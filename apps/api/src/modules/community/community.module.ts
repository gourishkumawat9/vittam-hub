import { Module } from "@nestjs/common";

import { BookmarksService } from "./bookmarks.service";
import { CommentsService } from "./comments.service";
import { CommunityController } from "./community.controller";
import { EventsService } from "./events.service";
import { LikesService } from "./likes.service";
import { PollsService } from "./polls.service";
import { PostsService } from "./posts.service";

@Module({
  controllers: [CommunityController],
  providers: [PostsService, CommentsService, LikesService, PollsService, EventsService, BookmarksService],
})
export class CommunityModule {}
