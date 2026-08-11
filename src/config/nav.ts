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

export const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "Discover Jobs", href: "/jobs", icon: Search },
      { title: "Applications", href: "/applications", icon: Briefcase },
      { title: "Recruiter Messages", href: "/recruiter-messages", icon: MailCheck },
      { title: "Resumes", href: "/resume", icon: FileText },
      { title: "Recruiter Outreach", href: "/outreach", icon: Send },
      { title: "Approvals", href: "/approvals", icon: ShieldCheck },
    ],
  },
  {
    label: "Automation",
    items: [
      { title: "Autopilot", href: "/automations", icon: Bot },
      { title: "Saved Searches", href: "/jobs/saved", icon: Bookmark },
      { title: "Follow-ups", href: "/follow-ups", icon: BellRing },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Activity", href: "/activity", icon: Activity },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Candidate Profile", href: "/settings/profile", icon: UserCircle },
      { title: "Preferences", href: "/settings/preferences", icon: SlidersHorizontal },
      { title: "Integrations", href: "/settings/integrations", icon: Plug },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat list — used by the command palette to search all destinations. */
export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);

export const mobileNavItems: (NavItem | { title: "More"; href: "#more"; icon: LucideIcon }) [] = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "Jobs", href: "/jobs", icon: Search },
  { title: "Applications", href: "/applications", icon: Briefcase },
  { title: "Approvals", href: "/approvals", icon: ShieldCheck },
  { title: "More", href: "#more", icon: MoreHorizontal },
];
