"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, type NavItem } from "@/config/nav";
import { useSidebar } from "@/components/app-shell/sidebar-context";
import { useAutopilot } from "@/lib/hooks/use-autopilot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function isActive(pathname: string, item: NavItem) {
  const match = item.match ?? item.href;
  if (match === "/dashboard") return pathname === match;
  return pathname === match || pathname.startsWith(`${match}/`);
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const { collapsed, toggle } = useSidebar();
  const { busy } = useAutopilot();

  return (
    <aside
      className={cn(
        "hidden md:flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {/* The wordmark goes home, and home is now the landing page rather
            than the dashboard. Before this there was no route back to `/` at
            all — you had to edit the URL by hand. */}
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" strokeWidth={2} />
            </span>
            <span className="text-[15px] tracking-tight">CareerOS</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-2.5 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/40">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: automation status + user */}
      <div className="shrink-0 border-t border-sidebar-border p-2.5 space-y-2.5">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md bg-sidebar-accent/50 px-2.5 py-2 text-xs",
            collapsed && "justify-center px-0"
          )}
        >
          {/* Live, from the same hook the top nav uses. Both of these pills
              were hardcoded once; the top-nav one was fixed and this was left,
              so the app showed "Running" in one corner and "idle" in the other
              during the same run. A status that cannot change is decoration
              wearing the costume of a reading. */}
          <span className="relative flex size-2 shrink-0">
            {busy && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                busy ? "bg-success" : "bg-muted-foreground/60"
              )}
            />
          </span>
          {!collapsed && (
            <span className="flex items-center gap-1.5 text-sidebar-foreground/70">
              <Bot className="size-3.5" strokeWidth={1.75} />
              {busy ? "Autopilot running" : "Autopilot idle"}
            </span>
          )}
        </div>

        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-sidebar-accent/60",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
              HS
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium text-sidebar-foreground">
                Himanshu Srivastava
              </div>
              <div className="truncate text-[11px] text-sidebar-foreground/50">
                Candidate profile
              </div>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
