import { UploadIcon } from "lucide-react";
import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from "@mux/mux-uploader-react";
import { Button } from "@/components/ui/button";

interface StudioUploaderProps {
  endpoint?: string | null;
  onSuccess: () => void;
}
const UPLOAD_ID = "video-uploader";

export const StudioUploader = ({
  endpoint,
  onSuccess,
}: StudioUploaderProps) => {
  return (
    <div>
      <MuxUploader
        endpoint={endpoint}
        onSuccess={onSuccess}
        id={UPLOAD_ID}
        className="hidden group/uploader"
      />
      <MuxUploaderDrop muxUploader={UPLOAD_ID} className="group/drop">
        <div slot="heading" className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 flex items-center justify-center gap-2 rounded-full bg-muted ">
            <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]] animate-bounce " />
          </div>
          <div className="flex flex-col text-center gap-2">
            <p className="text-sm">Drag and drop video files to upload</p>
            <p className="text-sm text-muted-foreground">
              Your video will be private until you publish them
            </p>
          </div>
          <MuxUploaderFileSelect muxUploader={UPLOAD_ID}>
            <Button type="button" className="rounded-full">
              Select file
            </Button>
          </MuxUploaderFileSelect>
        </div>
        <span slot="separator" className="hidden"></span>
        <MuxUploaderStatus muxUploader={UPLOAD_ID} />
        <MuxUploaderProgress
          type="percentage"
          muxUploader={UPLOAD_ID}
          className="text-sm"
        />
        <MuxUploaderProgress type="bar" muxUploader={UPLOAD_ID} />
      </MuxUploaderDrop>
    </div>
  );
};
