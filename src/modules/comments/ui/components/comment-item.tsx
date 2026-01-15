"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CommentGetManyOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CommentForm } from "./comment-form";
import { useState } from "react";
import { CommentReplies } from "./comment-replies";

interface CommentItemProps {
  comment: CommentGetManyOutput["items"][number];
  variant: "comment" | "reply";
}

export const CommentItem = ({
  comment,
  variant = "comment",
}: CommentItemProps) => {
  const { userId: userClerkId } = useAuth();
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const deleteComment = trpc.comments.remove.useMutation({
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn({
          redirectUrl: window.location.href,
        });
      }
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Comment deleted");
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
  });

  const likeComment = trpc.commentReactions.like.useMutation({
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn({
          redirectUrl: window.location.href,
        });
      }
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Comment liked");
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
  });
  const dislikeComment = trpc.commentReactions.dislike.useMutation({
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn({
          redirectUrl: window.location.href,
        });
      }
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Comment disliked");
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
  });
  return (
    <div>
      <div className="flex gap-4">
        <Link prefetch href={`/users/${comment.userId}`}>
          <UserAvatar
            size={variant === "comment" ? "lg" : "sm"}
            imageUrl={comment.user?.imageUrl}
            name={comment.user.name}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link prefetch href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
            </div>
          </Link>
          <p className="text-sm ">{comment.value}</p>
          {/* comment reactions */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <Button
                disabled={likeComment.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  likeComment.mutate({ commentId: comment.id });
                }}
              >
                <ThumbsUpIcon
                  className={cn(
                    comment.viewerReactions === "like" ? "fill-black" : ""
                  )}
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {comment.likeCounts}
              </span>
              <Button
                disabled={dislikeComment.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  dislikeComment.mutate({ commentId: comment.id });
                }}
              >
                <ThumbsDownIcon
                  className={cn(
                    comment.viewerReactions === "dislike" ? "fill-black" : ""
                  )}
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {comment.dislikeCounts}
              </span>
            </div>
            {variant === "comment" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setIsReplayOpen(true);
                }}
              >
                Replay
              </Button>
            )}
          </div>
        </div>
        {(variant === "comment" ||
          (variant === "reply" && userClerkId === comment.user.clerkId)) && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-8">
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {variant === "comment" && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsReplayOpen(true);
                  }}
                >
                  <MessageSquareIcon className="size-4" />
                  Replay
                </DropdownMenuItem>
              )}
              {userClerkId === comment.user.clerkId && (
                <DropdownMenuItem
                  onClick={() => {
                    deleteComment.mutate({ commentId: comment.id });
                  }}
                  disabled={deleteComment.isPending}
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {variant === "comment" && isReplayOpen && (
        <div className="mt-2 ml-12">
          <CommentForm
            videoId={comment.videoId}
            variant="replay"
            parentId={comment.id}
            onCancel={() => {
              setIsReplayOpen(false);
            }}
            onSuccess={() => {
              setIsReplayOpen(false);
              setIsRepliesOpen(true);
            }}
          />
        </div>
      )}
      {comment.replyCount > 0 && variant === "comment" && (
        <div className="pl-14">
          <Button
            size="sm"
            variant="tertiary"
            onClick={() => {
              setIsRepliesOpen(!isRepliesOpen);
            }}
          >
            {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} replies
          </Button>
        </div>
      )}
      {isRepliesOpen && (
        <CommentReplies parentId={comment.id} videoId={comment.videoId} />
      )}
    </div>
  );
};
