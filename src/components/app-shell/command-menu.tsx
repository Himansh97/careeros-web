"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Bot,
  Pause,
  FileText,
  ShieldCheck,
  Plus,
  Download,
} from "lucide-react";
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

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickCommands = [
  {
    title: "Search new jobs",
    icon: Search,
    run: (nav: (href: string) => void) => nav("/jobs"),
  },
  {
    title: "Run Autopilot",
    icon: Bot,
    run: () => toast.info("Autopilot isn't connected yet — this will start a discovery + tailoring run once automation is wired up."),
  },
  {
    title: "Pause automation",
    icon: Pause,
    run: () => toast.info("No automation is running yet, so there's nothing to pause."),
  },
  {
    title: "Tailor resume",
    icon: FileText,
    run: (nav: (href: string) => void) => nav("/resume"),
  },
  {
    title: "Review approvals",
    icon: ShieldCheck,
    run: (nav: (href: string) => void) => nav("/approvals"),
  },
  {
    title: "Add job manually",
    icon: Plus,
    run: (nav: (href: string) => void) => nav("/jobs"),
  },
  {
    title: "Export daily report",
    icon: Download,
    run: () => toast.info("Reporting isn't connected yet — analytics data doesn't exist until real applications run through the pipeline."),
  },
];

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();

  const navigate = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
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
              onSelect={() => {
                onOpenChange(false);
                cmd.run(navigate);
              }}
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
