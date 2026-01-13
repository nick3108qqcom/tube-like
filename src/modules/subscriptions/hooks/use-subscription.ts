import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface UseSubscriptionProps {
  userId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
}

export const useSubscription = ({
  userId,
  fromVideoId,
  isSubscribed,
}: UseSubscriptionProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const create = trpc.subscriptions.create.useMutation({
    onError: (error) => {
      toast.error("something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
    onSuccess: () => {
      toast.success("subscribed");
      utils.videos.getManySubscribed.invalidate();
      utils.users.getOne.invalidate({ id: userId });
      if (fromVideoId) {
        utils.videos.getOne.invalidate({ id: fromVideoId });
      }
    },
  });

  const remove = trpc.subscriptions.remove.useMutation({
    onError: (error) => {
      toast.error("something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
    onSuccess: () => {
      toast.success("unsubscribed");
      utils.videos.getManySubscribed.invalidate();
      utils.users.getOne.invalidate({ id: userId });
      if (fromVideoId) {
        utils.videos.getOne.invalidate({ id: fromVideoId });
      }
    },
  });

  const isPending = create.isPending || remove.isPending;

  const onClick = () => {
    if (isSubscribed) {
      remove.mutate({ userId });
    } else {
      create.mutate({ userId });
    }
  };
  return {
    isPending,
    onClick,
  };
};
