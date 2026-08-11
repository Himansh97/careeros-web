"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Bot, FileText, ShieldCheck, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { allNavItems } from "@/config/nav";
import { useAutopilot } from "@/lib/hooks/use-autopilot";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Every command here does something.
 *
 * "Pause automation" and "Export daily report" used to sit in this list and
 * only ever explained that they were not implemented — a palette entry that
 * exists to apologise is worse than no entry, because it still costs a search
 * result and a keystroke. They are gone until there is something behind them.
 */
interface QuickCommand {
  title: string;
  icon: typeof Search;
  href?: string;
  action?: "autopilot";
}

const quickCommands: QuickCommand[] = [
  { title: "Search new jobs", icon: Search, href: "/jobs" },
  { title: "Run Autopilot", icon: Bot, action: "autopilot" },
  { title: "Tailor resume", icon: FileText, href: "/resume" },
  { title: "Review approvals", icon: ShieldCheck, href: "/approvals" },
  { title: "Add job manually", icon: Plus, href: "/jobs" },
];

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const { run: runAutopilot } = useAutopilot();

  const navigate = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  const execute = React.useCallback(
    (cmd: QuickCommand) => {
      onOpenChange(false);
      if (cmd.href) navigate(cmd.href);
      else if (cmd.action === "autopilot") void runAutopilot();
    },
    [navigate, onOpenChange, runAutopilot]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command Menu" description="Search jobs, applications, and commands">
      <CommandInput placeholder="Search jobs, applications, recruiters, commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          {allNavItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => navigate(item.href)}
            >
              <item.icon />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Commands">
          {quickCommands.map((cmd) => (
            <CommandItem
              key={cmd.title}
              value={cmd.title}
              onSelect={() => execute(cmd)}
            >
              <cmd.icon />
              <span>{cmd.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
