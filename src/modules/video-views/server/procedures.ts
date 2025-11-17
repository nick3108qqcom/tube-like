import z from "zod";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videoViewsRouter = createTRPCRouter({
  createView: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id: videoId } = input;

      const [existingView] = await db
        .select()
        .from(videoViews)
        .where(
          and(eq(videoViews.videoId, videoId), eq(videoViews.userId, userId))
        );

      if (existingView) {
        return existingView;
      }
      const createView = await db.insert(videoViews).values({
        videoId,
        userId,
      });
      return createView;
    }),
});
