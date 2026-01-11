"use client";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { toast } from "sonner";

interface PlaylistAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
}

export const PlaylistAddModal = ({
  open,
  onOpenChange,
  videoId,
}: PlaylistAddModalProps) => {
  const utils = trpc.useUtils();
  const {
    data: playlists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = trpc.playlists.getManyForVideo.useInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
      videoId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: open && !!videoId,
    }
  );

  const addVideoToPlaylist = trpc.playlists.addVideo.useMutation({
    onSuccess: () => {
      utils.playlists.getManyForVideo.invalidate({ videoId });
      utils.playlists.getMany.invalidate();
      toast.success("Video added to playlist successfully");
    },
  });

  const removeVideoFromPlaylist = trpc.playlists.removeVideo.useMutation({
    onSuccess: () => {
      utils.playlists.getManyForVideo.invalidate({ videoId });
      utils.playlists.getMany.invalidate();
      toast.success("Video removed from playlist successfully");
    },
  });

  return (
    <ResponsiveModal
      title="Add to playlist"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading &&
          playlists?.pages
            .flatMap((page) => page.items)
            .map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start px-2 [&_svg]:size-5"
                size="lg"
                disabled={
                  addVideoToPlaylist.isPending ||
                  removeVideoFromPlaylist.isPending
                }
                onClick={() => {
                  if (!item.containsVideo) {
                    addVideoToPlaylist.mutate({
                      playlistId: item.id,
                      videoId,
                    });
                  } else {
                    removeVideoFromPlaylist.mutate({
                      playlistId: item.id,
                      videoId,
                    });
                  }
                }}
              >
                {item.containsVideo ? (
                  <SquareCheckIcon className="mr-2" />
                ) : (
                  <SquareIcon className="mr-2" />
                )}
                {item.name}
              </Button>
            ))}
        {!isLoading && (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            isManual
          />
        )}
      </div>
    </ResponsiveModal>
  );
};
