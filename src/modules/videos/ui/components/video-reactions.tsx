"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: "like" | "dislike";
}
export const VideoReactions = ({
  viewerReaction,
  videoId,
  likes,
  dislikes,
}: VideoReactionsProps) => {
  const utils = trpc.useUtils();
  const clerk = useClerk();

  const createLike = trpc.videoReactions.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({
        id: videoId,
      });
    },
    onError: ({ message }) => {
      if (message === "UNAUTHORIZED") {
        clerk.openSignIn();
        return;
      }
      toast.error("something went wrong");
    },
  });

  const createDislike = trpc.videoReactions.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({
        id: videoId,
      });
    },
    onError: ({ message }) => {
      if (message === "UNAUTHORIZED") {
        clerk.openSignIn();
        return;
      }
      toast.error("something went wrong");
    },
  });

  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-full rounded-r-none gap-2 pr-4"
        variant={"secondary"}
        onClick={() => createLike.mutate({ id: videoId })}
        disabled={createLike.isPending || createDislike.isPending}
      >
        <ThumbsUpIcon
          className={cn("size-5", viewerReaction === "like" && "fill-black")}
        />
        {likes}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        className="rounded-full rounded-l-none gap-2 pl-3"
        variant={"secondary"}
        onClick={() => createDislike.mutate({ id: videoId })}
        disabled={createLike.isPending || createDislike.isPending}
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction === "dislike" && "fill-black")}
        />
        {dislikes}
      </Button>
    </div>
  );
};
