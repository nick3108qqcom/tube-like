import { z } from "zod";
import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import {
  users,
  videos,
  playlists,
  videoViews,
  playlistsVideos,
  videoReactions,
} from "@/db/schema";
import { TRPCError } from "@trpc/server";

export const playListsRouter = createTRPCRouter({
  removeVideo: protectedProcedure
    .input(z.object({ playlistId: z.uuid(), videoId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;

      // check if playlist exists
      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      // check if video exists
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      // check if video is in playlist
      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistsVideos)
        .where(
          and(
            eq(playlistsVideos.playlistId, playlistId),
            eq(playlistsVideos.videoId, videoId)
          )
        );

      if (!existingPlaylistVideo) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const [deletePlaylistVideo] = await db
        .delete(playlistsVideos)
        .where(
          and(
            eq(playlistsVideos.playlistId, playlistId),
            eq(playlistsVideos.videoId, videoId)
          )
        )
        .returning();

      if (!deletePlaylistVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }
      return deletePlaylistVideo;
    }),
  addVideo: protectedProcedure
    .input(z.object({ playlistId: z.uuid(), videoId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;
      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistsVideos)
        .where(
          and(
            eq(playlistsVideos.playlistId, playlistId),
            eq(playlistsVideos.videoId, videoId)
          )
        );

      if (existingPlaylistVideo) {
        throw new TRPCError({
          code: "CONFLICT",
        });
      }

      const [createPlaylistVideo] = await db
        .insert(playlistsVideos)
        .values({
          videoId,
          playlistId,
        })
        .returning();

      if (!createPlaylistVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }
      return createPlaylistVideo;
    }),
  getManyForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit, videoId } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistsVideos,
            eq(playlistsVideos.playlistId, playlists.id)
          ),
          user: users,
          containsVideo: sql<boolean>`(
            SELECT EXISTS(
              SELECT 1 
              FROM ${playlistsVideos} 
              WHERE ${playlistsVideos.playlistId} = ${playlists.id} 
              AND ${playlistsVideos.videoId} = ${videoId}
            )
          )`.mapWith(Boolean),
        })
        .from(playlists)
        .leftJoin(users, eq(playlists.userId, users.id))
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1);

      //Remove the last item if there is more data
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      // set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;
      return { items, nextCursor };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const latestVideoThumbnail = db.$with("latest_video_thumbnail").as(
        db
          .selectDistinctOn([playlistsVideos.playlistId], {
            playlistId: playlistsVideos.playlistId,
            thumbnailUrl: videos.thumbnailUrl,
          })
          .from(playlistsVideos)
          .innerJoin(videos, eq(videos.id, playlistsVideos.videoId))
          .orderBy(playlistsVideos.playlistId, desc(playlistsVideos.updatedAt))
      );

      const data = await db
        .with(latestVideoThumbnail)
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistsVideos,
            eq(playlists.id, playlistsVideos.playlistId)
          ),
          thumbnailUrl: latestVideoThumbnail.thumbnailUrl,
        })
        .from(playlists)
        .leftJoin(
          latestVideoThumbnail,
          eq(playlists.id, latestVideoThumbnail.playlistId)
        )
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1);
      //Remove the last item if there is more data
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      // set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;
      return { items, nextCursor };
    }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { name } = input;

      const [createPlaylist] = await db
        .insert(playlists)
        .values({
          userId,
          name,
        })
        .returning();
      if (!createPlaylist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }
      return createPlaylist;
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.uuid(),
            viewedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewVideoViews = db.$with("view_video_views").as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId))
      );

      const data = await db
        .with(viewVideoViews)
        .select({
          ...getTableColumns(videos),
          viewedAt: viewVideoViews.viewedAt,
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike")
            )
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(viewVideoViews, eq(videos.id, viewVideoViews.videoId))
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewVideoViews.viewedAt, cursor.viewedAt),
                  and(
                    eq(viewVideoViews.viewedAt, cursor.viewedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(viewVideoViews.viewedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1);

      //Remove the last item if there is more data
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      // set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            viewedAt: lastItem.viewedAt,
          }
        : null;
      return { items, nextCursor };
    }),
  getLiked: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            likedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewVideoReactions = db.$with("view_video_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.createdAt,
          })
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.type, "like")
            )
          )
      );

      const data = await db
        .with(viewVideoReactions)
        .select({
          ...getTableColumns(videos),
          user: users,
          likedAt: viewVideoReactions.likedAt,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike")
            )
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(
          viewVideoReactions,
          eq(videos.id, viewVideoReactions.videoId)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewVideoReactions.likedAt, cursor.likedAt),
                  and(
                    eq(viewVideoReactions.likedAt, cursor.likedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(viewVideoReactions.likedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1);

      //Remove the last item if there is more data
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      // set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            likedAt: lastItem.likedAt,
          }
        : null;
      return { items, nextCursor };
    }),
});
