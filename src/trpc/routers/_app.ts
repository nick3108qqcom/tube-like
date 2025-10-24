import { createTRPCRouter } from "../init";
import { videosRouter } from "@/modules/videos/server/procedures";
import { studioRouter } from "@/modules/studio/server/procedures";
import { categoriesRouter } from "@/modules/categories/server/procedures";

export const appRouter = createTRPCRouter({
  studio: studioRouter,
  categories: categoriesRouter,
  videos: videosRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
