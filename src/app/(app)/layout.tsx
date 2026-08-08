import { SidebarProvider } from "@/components/app-shell/sidebar-context";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TopNav } from "@/components/app-shell/top-nav";
import { MobileNav } from "@/components/app-shell/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-svh w-full overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
