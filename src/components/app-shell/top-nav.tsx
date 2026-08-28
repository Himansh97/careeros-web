"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, Bot, Sun, Moon, Laptop, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { CommandMenu } from "@/components/app-shell/command-menu";
import { useAutopilot } from "@/lib/hooks/use-autopilot";
import { listAlerts } from "@/lib/api/ops";

export function TopNav() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const router = useRouter();
  const { run: runAutopilot, running, busy } = useAutopilot();
  const { theme, setTheme } = useTheme();

  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: listAlerts });
  const alertsData = alertsQuery.data?.ok ? alertsQuery.data.data : null;
  const alerts = alertsData?.alerts ?? [];
  const high = alertsData?.high ?? 0;

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Search / command trigger */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-input bg-secondary/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
        >
          <Search className="size-3.5" strokeWidth={1.75} />
          <span className="flex-1 text-left">Search or run a command</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Automation status pill — was static "Idle", including mid-run. */}
          <div className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground sm:flex">
            <span className="relative flex size-1.5">
              {busy && (
                <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-success/70" />
              )}
              <span
                className={`relative inline-flex size-1.5 rounded-full ${
                  busy ? "bg-success" : "bg-muted-foreground/60"
                }`}
              />
            </span>
            <Bot className="size-3.5" strokeWidth={1.75} />
            {busy ? "Running" : "Idle"}
          </div>

          {/* Notifications — the real alert feed, not a placeholder.
              This read "No notifications yet." unconditionally, which is a
              worse lie than having no bell: there are outstanding alerts most
              days, and a control that reports calm while the pipeline is
              blocked teaches you to stop looking at it. Same endpoint the
              dashboard banner and CAPCOM already use. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-8" aria-label={
                high > 0 ? `Notifications, ${high} urgent` : "Notifications"
              }>
                <Bell className="size-4" strokeWidth={1.75} />
                {high > 0 && (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>
                {alerts.length > 0
                  ? `${alerts.length} outstanding${high > 0 ? ` · ${high} urgent` : ""}`
                  : "Notifications"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alerts.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {alertsQuery.isLoading ? "Checking…" : "Nothing outstanding."}
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {alerts.slice(0, 8).map((alert) => (
                    <DropdownMenuItem
                      key={`${alert.kind}-${alert.ref ?? alert.title}`}
                      className="flex-col items-start gap-0.5 whitespace-normal py-2"
                      onClick={() => router.push("/dashboard")}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {alert.severity === "high" && (
                          <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                        )}
                        {alert.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.action}</span>
                    </DropdownMenuItem>
                  ))}
                  {alerts.length > 8 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      and {alerts.length - 8} more on the dashboard
                    </div>
                  )}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add a job by link. Previously this navigated to /jobs and stopped,
              so the plus icon promised an action and delivered a page. The
              importer already exists there; this opens it. */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => router.push("/jobs?add=1")}
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            Add Job
          </Button>

          {/* Run autopilot */}
          <Button size="sm" onClick={() => void runAutopilot()} disabled={running}>
            {running ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            ) : (
              <Bot className="size-3.5" strokeWidth={1.75} />
            )}
            <span className="hidden sm:inline">
              {running ? "Running…" : "Run Autopilot"}
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full" aria-label="User menu">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                    HS
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Himanshu Srivastava</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                Candidate profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <div className="flex items-center gap-1 px-2 pb-1.5">
                {[
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "system", icon: Laptop, label: "System" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    aria-label={opt.label}
                    aria-pressed={theme === opt.value}
                    className={`flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 text-xs transition-colors ${
                      theme === opt.value
                        ? "border-primary/40 bg-accent text-accent-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <opt.icon className="size-3.5" strokeWidth={1.75} />
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
