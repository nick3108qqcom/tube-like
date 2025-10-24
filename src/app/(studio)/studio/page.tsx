import { DEFAULT_LIMIT } from "@/constants";
import { trpc, HydrateClient } from "@/trpc/server";
import { StudioView } from "@/modules/studio/ui/view/studio-view";

const page = async () => {
  void trpc.studio.getMany.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
};

export default page;
