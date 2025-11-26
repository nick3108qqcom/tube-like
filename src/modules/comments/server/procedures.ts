import z from "zod";
import { db } from "@/db";
import { eq, getTableColumns } from "drizzle-orm";
import { comments, users } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";

export const commentsRouter = createTRPCRouter({
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
      })
    )
    .query(async ({ input }) => {
      const { videoId } = input;
      const data = await db
        .select({
          ...getTableColumns(comments),
          user: users,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.videoId, videoId));

      return data;
    }),
});
