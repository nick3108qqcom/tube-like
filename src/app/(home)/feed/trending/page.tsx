import { trpc } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient } from "@/trpc/server";
import { TrendingView } from "@/modules/home/ui/views/trending-view";

export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.videos.getManyTrending.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <TrendingView></TrendingView>
    </HydrateClient>
  );
};

export default Page;
