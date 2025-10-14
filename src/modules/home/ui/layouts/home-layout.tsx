import { SidebarProvider } from "@/components/ui/sidebar";
import { HomeNavbar } from "../components/home-navbar";
import HomeSidebar from "../components/home-sidebar";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function homeLayout({ children }: HomeLayoutProps) {
  return (
    <SidebarProvider>
      <div className="w-full">
        <HomeNavbar />
        <div className="pt-[4rem] flex min-h-screen">
          <HomeSidebar />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
