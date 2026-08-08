"use client";

import * as React from "react";

const STORAGE_KEY = "careeros:sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function subscribe() {
  // No external mutation events to react to — localStorage is only read
  // once on mount, so a no-op unsubscribe is correct here.
  return () => {};
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const storedCollapsed = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [override, setOverride] = React.useState<boolean | null>(null);
  const collapsed = override ?? storedCollapsed;

  const toggle = React.useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? getSnapshot();
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}
