"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { LogOutIcon, VideoIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { StudioSidebarHeader } from "./studio-sidebar-header";

export default function StudioSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar className="pt-16 z-40" collapsible="icon">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <StudioSidebarHeader />
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Studio"
                  isActive={pathname === "/studio"}
                >
                  <Link href="/studio">
                    <VideoIcon />
                    <span className="text-sm">Content</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Separator />
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Exit studio">
                  <Link href="/">
                    <LogOutIcon />
                    <span className="text-sm">Exit studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
