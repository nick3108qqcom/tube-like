import { z } from "zod";
import { db } from "@/db";
import { mux } from "@/lib/mux";
import { and, eq, getTableColumns } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { users, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { UTApi } from "uploadthing/server";

export const videosRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const [video] = await db
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
          },
          viewCount: db.$count(videoViews, eq(videoViews.videoId, input.id)),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(eq(videos.id, input.id))
        .limit(1);

      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      return video;
    }),
  restoreThumbnail: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const utapi = new UTApi();
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete old image file from uploadthing
      if (existingVideo.thumbnailKey) {
        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({
            thumbnailKey: null,
            thumbnailUrl: null,
          })
          .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      }

      if (!existingVideo?.muxPlaybackId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }

      const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
      const uploadedThumbnail = await utapi.uploadFilesFromUrl(
        tempThumbnailUrl
      );

      if (!uploadedThumbnail.data)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });

      const { url: thumbnailUrl, key: thumbnailKey } = uploadedThumbnail.data;
      const [updateVideo] = await db
        .update(videos)
        .set({
          thumbnailUrl,
          thumbnailKey,
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      return updateVideo;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const utapi = new UTApi();

      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (removedVideo.thumbnailKey) {
        utapi.deleteFiles(removedVideo.thumbnailKey);
      }
      if (removedVideo.previewKey) {
        utapi.deleteFiles(removedVideo.previewKey);
      }

      if (!removedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return removedVideo;
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updateVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updateVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return updateVideo;
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
      },
      cors_origin: "*",
    });

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "Untitled",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning();
    return {
      video,
      url: upload.url,
    };
  }),
});
