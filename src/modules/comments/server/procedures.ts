import z from "zod";
import { db } from "@/db";
import {
  eq,
  getTableColumns,
  lt,
  and,
  or,
  desc,
  inArray,
  isNull,
  isNotNull,
  count,
} from "drizzle-orm";
import { commentReactions, comments, users } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(z.object({ commentId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { commentId } = input;

      const [deleteComment] = await db
        .delete(comments)
        .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
        .returning();

      if (!deleteComment) {
        return new TRPCError({ code: "NOT_FOUND" });
      }
      return deleteComment;
    }),
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        parentId: z.uuid().nullish(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { videoId, value, parentId } = input;

      const [parentComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []));

      if (parentId && !parentComment) {
        return new TRPCError({ code: "NOT_FOUND" });
      }

      if (parentId && parentComment?.parentId) {
        return new TRPCError({ code: "BAD_REQUEST" });
      }
      const [createComment] = await db
        .insert(comments)
        .values({
          videoId,
          userId,
          value,
          parentId,
        })
        .returning();

      return createComment;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        parentId: z.uuid().nullish(),
        limit: z.number().min(1).max(100),
        cursor: z
          .object({
            id: z.uuid(),
            updateAt: z.date(),
          })
          .nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { videoId, cursor, limit, parentId } = input;
      const { clerkUserId } = ctx;

      let userId;
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      if (user) userId = user.id;

      const viewerReaction = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );

      const replies = db.$with("replies").as(
        db
          .select({
            parentId: comments.parentId,
            count: count(comments.id).as("count"),
          })
          .from(comments)
          .where(isNotNull(comments.parentId))
          .groupBy(comments.parentId)
      );

      const totalCount = await db.$count(
        comments,
        eq(comments.videoId, videoId)
      );

      const data = await db
        .with(viewerReaction, replies)
        .select({
          ...getTableColumns(comments),
          user: users,
          viewerReactions: viewerReaction.type,
          replyCount: replies.count,
          likeCounts: db.$count(
            commentReactions,
            and(
              eq(commentReactions.commentId, comments.id),
              eq(commentReactions.type, "like")
            )
          ),
          dislikeCounts: db.$count(
            commentReactions,
            and(
              eq(commentReactions.commentId, comments.id),
              eq(commentReactions.type, "dislike")
            )
          ),
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(viewerReaction, eq(comments.id, viewerReaction.commentId))
        .leftJoin(replies, eq(comments.id, replies.parentId))
        .where(
          and(
            eq(comments.videoId, videoId),
            parentId
              ? eq(comments.parentId, parentId)
              : isNull(comments.parentId),
            cursor
              ? or(
                  lt(comments.updatedAt, cursor.updateAt),
                  and(
                    eq(comments.id, cursor.id),
                    lt(comments.updatedAt, cursor.updateAt)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(comments.updatedAt), desc(comments.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            updateAt: lastItem.updatedAt,
            id: lastItem.id,
          }
        : null;
      return { items, nextCursor, totalCount };
    }),
});
