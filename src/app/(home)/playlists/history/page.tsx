import { trpc } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient } from "@/trpc/server";
import { HistoryView } from "@/modules/playlists/ui/views/history-view";

export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.playlists.getHistory.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <HistoryView></HistoryView>
    </HydrateClient>
  );
};

export default Page;
