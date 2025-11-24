"use client ";
import { useMemo } from "react";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { format, formatDistanceToNow } from "date-fns";
import { VideoGetOneOutput } from "../../types";
import { VideoReactions } from "./video-reactions";
import { VideoDescription } from "./video-description";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoTopRowProps {
  video: VideoGetOneOutput;
}

export const VideoTopRowSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 mt-4 ">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-4/5 md:2/5" />
      </div>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 w-[70%]">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-5 w-4/5 md:2/6" />
            <Skeleton className="h-5 w-3/5 md:1/5" />
          </div>
        </div>
        <Skeleton className="h-9 w-2/6 md:1/6 rounded-xl" />
      </div>
      <div className="h-[120px] w-full"></div>
    </div>
  );
};
export const VideoTopRow = ({ video }: VideoTopRowProps) => {
  const compactView = useMemo(() => {
    return Intl.NumberFormat("en-Us", {
      notation: "compact",
    }).format(video.viewCount);
  }, [video.viewCount]);

  const expandedViews = useMemo(() => {
    return Intl.NumberFormat("en-Us", {
      notation: "standard",
    }).format(video.viewCount);
  }, [video.viewCount]);

  const compactDate = useMemo(() => {
    return formatDistanceToNow(video.createdAt, { addSuffix: true });
  }, [video.createdAt]);

  const expandedDate = useMemo(() => {
    return format(video.createdAt, "dd MMM yyyy");
  }, [video.createdAt]);

  return (
    <div className="flex flex-col gap-4 mt-4 ">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id} />
        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions
            likes={video.likeCount}
            dislikes={video.dislikeCount}
            videoId={video.id}
            viewerReaction={video.viewerReaction}
          />
          <VideoMenu videoId={video.id} variant="secondary" />
        </div>
      </div>
      <VideoDescription
        compactViews={compactView}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description}
      />
    </div>
  );
};
