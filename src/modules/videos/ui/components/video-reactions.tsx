import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";

export const VideoReactions = () => {
  const viewerReaction: "like" | "dislike" = "like";
  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-full rounded-r-none gap-2 pr-4"
        variant={"secondary"}
      >
        <ThumbsUpIcon
          className={cn("size-5", viewerReaction === "like" && "fill-black")}
        />
        {1}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        className="rounded-full rounded-l-none gap-2 pl-3"
        variant={"secondary"}
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction !== "like" && "fill-black")}
        />
        {1}
      </Button>
    </div>
  );
};
