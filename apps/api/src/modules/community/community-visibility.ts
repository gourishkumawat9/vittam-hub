import { NotFoundException } from "@nestjs/common";
import type { Post } from "@prisma/client";

import { isDemoViewer } from "../../common/demo/demo-scope";
import type { PrismaService } from "../../database/prisma/prisma.service";

/**
 * The post, if this viewer is allowed to see it. Demo accounts have their own
 * feed (common/demo/demo-scope.ts), and the feed applied that rule, but
 * commenting, liking, voting, RSVPing and bookmarking all took a post id
 * straight from the URL: a demo visitor could write on a real member's post,
 * and the other way round. Everything that acts on one post starts here.
 *
 * "Not found" either way, so the answer never confirms a post exists on the
 * other side.
 */
export async function findVisiblePost(prisma: PrismaService, postId: string, viewerId: string): Promise<Post> {
  const [post, viewerIsDemo] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId } }),
    isDemoViewer(prisma, viewerId),
  ]);
  if (!post) throw new NotFoundException("Post not found");
  const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { isDemo: true } });
  if (!author || author.isDemo !== viewerIsDemo) throw new NotFoundException("Post not found");
  return post;
}
