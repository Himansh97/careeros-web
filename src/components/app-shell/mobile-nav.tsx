"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileNavItems, navSections } from "@/config/nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch border-t border-border bg-background/95 backdrop-blur md:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;

        if (item.href === "#more") {
          return (
            <Sheet key="more" open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
                  aria-label="More navigation"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  More
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80svh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Sparkles className="size-3.5" strokeWidth={2} />
                    </span>
                    CareerOS
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-5 px-4 pb-6">
                  {navSections.map((section) => (
                    <div key={section.label}>
                      <div className="pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {section.label}
                      </div>
                      <div className="space-y-0.5">
                        {section.items.map((navItem) => {
                          const ItemIcon = navItem.icon;
                          const active = isActive(pathname, navItem.href);
                          return (
                            <Link
                              key={navItem.href}
                              href={navItem.href}
                              onClick={() => setMoreOpen(false)}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                                active
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "text-foreground/70"
                              )}
                            >
                              <ItemIcon className="size-[18px]" strokeWidth={1.75} />
                              {navItem.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          );
        }

        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" strokeWidth={1.75} />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
