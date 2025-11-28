import z from "zod";
import { db } from "@/db";
import { eq, getTableColumns, lt, and, or, desc } from "drizzle-orm";
import { comments, users } from "@/db/schema";
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
    .input(z.object({ videoId: z.uuid(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { videoId, value } = input;

      const [createComment] = await db
        .insert(comments)
        .values({
          videoId,
          userId,
          value,
        })
        .returning();

      return createComment;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        limit: z.number().min(1).max(100),
        cursor: z
          .object({
            id: z.uuid(),
            updateAt: z.date(),
          })
          .nullish(),
      })
    )
    .query(async ({ input }) => {
      const { videoId, cursor, limit } = input;
      const totalCount = await db.$count(
        comments,
        eq(comments.videoId, videoId)
      );
      const data = await db
        .select({
          ...getTableColumns(comments),
          user: users,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(
          and(
            eq(comments.videoId, videoId),
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
