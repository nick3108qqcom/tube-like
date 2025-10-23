import StudioLayout from "@/modules/studio/ui/layouts/studio-layout";

interface LayoutProps {
  children: React.ReactNode;
}

export default function layout({ children }: LayoutProps) {
  return (
    <div>
      <StudioLayout>{children}</StudioLayout>
    </div>
  );
}
