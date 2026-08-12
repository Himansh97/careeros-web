import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  Briefcase,
  MailCheck,
  FileText,
  Send,
  ShieldCheck,
  Bot,
  Bookmark,
  BellRing,
  BarChart3,
  Activity,
  UserCircle,
  SlidersHorizontal,
  Plug,
  Settings,
  Home,
  MoreHorizontal,
  Contact,
  Radar,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Route prefix used to determine the "active" state — defaults to href. */
  match?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Grouped by where a job actually is in the process, not by which subsystem
 * built the page.
 *
 * This was sixteen items across four sections for a single user — including a
 * "Settings" section whose fourth entry was itself called "Settings", and five
 * separate destinations (Applications, Approvals, Follow-ups, Activity,
 * Recruiter Messages) sitting over one pipeline. The three `settings/*` pages
 * are now children of the one Settings entry rather than siblings of it.
 */
export const navSections: NavSection[] = [
  {
    label: "Pipeline",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "Discover Jobs", href: "/jobs", icon: Search },
      { title: "Resumes", href: "/resume", icon: FileText },
      { title: "Approvals", href: "/approvals", icon: ShieldCheck },
      { title: "Applications", href: "/applications", icon: Briefcase },
    ],
  },
  {
    label: "Outreach",
    items: [
      { title: "Recruiter Messages", href: "/recruiter-messages", icon: MailCheck },
      { title: "Recruiter Outreach", href: "/outreach", icon: Send },
      { title: "Follow-ups", href: "/follow-ups", icon: BellRing },
      { title: "Contacts", href: "/contacts", icon: Contact },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Autopilot", href: "/automations", icon: Bot },
      { title: "Saved Searches", href: "/jobs/saved", icon: Bookmark },
      { title: "Mission Review", href: "/review", icon: Radar },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Activity", href: "/activity", icon: Activity },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/**
 * Reachable from the Settings page, not the sidebar.
 *
 * The command palette still searches them — `allNavItems` includes these —
 * because typing "profile" into ⌘K should find the profile page regardless of
 * how the sidebar is grouped.
 */
export const settingsChildren: NavItem[] = [
  { title: "Candidate Profile", href: "/settings/profile", icon: UserCircle },
  { title: "Preferences", href: "/settings/preferences", icon: SlidersHorizontal },
  { title: "Integrations", href: "/settings/integrations", icon: Plug },
];

/** Flat list — used by the command palette to search all destinations. */
export const allNavItems: NavItem[] = [
  ...navSections.flatMap((s) => s.items),
  ...settingsChildren,
];

export const mobileNavItems: (NavItem | { title: "More"; href: "#more"; icon: LucideIcon }) [] = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "Jobs", href: "/jobs", icon: Search },
  { title: "Applications", href: "/applications", icon: Briefcase },
  { title: "Approvals", href: "/approvals", icon: ShieldCheck },
  { title: "More", href: "#more", icon: MoreHorizontal },
];
