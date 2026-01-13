import { trpc } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient } from "@/trpc/server";
import { UserView } from "@/modules/users/ui/views/user-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ userId: string }>;
}
const Page = async ({ params }: PageProps) => {
  const { userId } = await params;

  void trpc.users.getOne.prefetch({
    id: userId,
  });

  void trpc.videos.getMany.prefetchInfinite({
    userId,
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <UserView userId={userId}></UserView>
    </HydrateClient>
  );
};

export default Page;
