import { Button } from "@/components/ui/button";
import { UserCircleIcon } from "lucide-react";

export default function AuthButton() {
  // TODO: Add different auth states
  return (
    <Button
      variant={"outline"}
      className="rounded-full border border-blue-500/20  px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 shadow-none "
    >
      <UserCircleIcon />
      sign in
    </Button>
  );
}
