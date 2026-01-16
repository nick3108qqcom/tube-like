"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { VideoGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOutput["viewerReaction"];
}
export const VideoReactions = ({
  viewerReaction,
  videoId,
  likes,
  dislikes,
}: VideoReactionsProps) => {
  const utils = trpc.useUtils();
  const clerk = useClerk();

  const like = trpc.videoReactions.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({
        id: videoId,
      });
      utils.playlists.getLiked.invalidate();
    },
    onError: (error) => {
      toast.error("something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const dislike = trpc.videoReactions.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({
        id: videoId,
      });
      utils.playlists.getLiked.invalidate();
    },
    onError: (error) => {
      toast.error("something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-full rounded-r-none gap-2 pr-4"
        variant={"secondary"}
        onClick={() => like.mutate({ id: videoId })}
        disabled={like.isPending || dislike.isPending}
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
        onClick={() => dislike.mutate({ id: videoId })}
        disabled={like.isPending || dislike.isPending}
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction === "dislike" && "fill-black")}
        />
        {dislikes}
      </Button>
    </div>
  );
};
