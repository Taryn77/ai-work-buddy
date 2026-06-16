import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mail,
  FileText,
  CalendarCheck,
  Telescope,
  MessageSquare,
  Settings,
  Briefcase,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandLockup } from "@/components/brand-mark";

const workspaceItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Meeting Summarizer", url: "/summarize", icon: FileText },
  { title: "Email Generator", url: "/email", icon: Mail },
  { title: "Task Planner", url: "/planner", icon: CalendarCheck },
] as const;

const assistantItems = [
  { title: "Research Assistant", url: "/research", icon: Telescope },
  { title: "AI Chatbot", url: "/chat", icon: MessageSquare },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderItem = (item: { title: string; url: string; icon: typeof LayoutDashboard }) => {
    const active = pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
          <Link to={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <BrandLockup />
      </SidebarHeader>
      <SidebarContent className="gap-5 px-2 py-2">
        {/* Workspace Group */}
        <SidebarGroup className="border border-sidebar-border rounded-xl p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-sidebar-primary text-sidebar-primary-foreground">
            <Briefcase className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold tracking-wide uppercase">Workspace</span>
            )}
          </div>
          <SidebarGroupContent className="p-1.5">
            <SidebarMenu>{workspaceItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Assistants Group */}
        <SidebarGroup className="border border-sidebar-border rounded-xl p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-sidebar-accent text-sidebar-accent-foreground">
            <Sparkles className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold tracking-wide uppercase">Assistants</span>
            )}
          </div>
          <SidebarGroupContent className="p-1.5">
            <SidebarMenu>{assistantItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
              <Link to="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
