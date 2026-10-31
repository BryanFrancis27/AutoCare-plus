"use client";

import { GuardedLink } from "@/components/layout/NavigationGuard";
import { Menu, Wrench } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
}

export function DashboardHeader({ sidebarOpen, setSidebarOpen, userName, userEmail }: DashboardHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-surface">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button id="navigation-toggle" type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-3 text-ink hover:bg-surfaceHover lg:hidden" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen} aria-controls="application-navigation"><Menu className="h-5 w-5" /></button>
          <GuardedLink href="/dashboard" className="flex items-center gap-2 rounded-lg text-ink" aria-label="AutoCare+ dashboard">
            <span className="hidden rounded-lg bg-accent p-2 text-onAccent sm:block"><Wrench className="h-5 w-5" aria-hidden="true" /></span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">AutoCare<span className="text-accent">+</span></span>
          </GuardedLink>
        </div>
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <NotificationDropdown />
          <div className="hidden min-w-0 flex-col items-end border-l border-line pl-4 md:flex">
            <span className="max-w-56 truncate text-sm font-semibold text-ink">{userName || "User"}</span>
            {userEmail && <span className="max-w-56 truncate text-xs text-muted">{userEmail}</span>}
          </div>
          <GuardedLink href="/profile" aria-label="Your profile" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-accentSoft font-semibold text-accent hover:bg-surfaceHover">{userName ? userName.charAt(0).toUpperCase() : "U"}</GuardedLink>
        </div>
      </div>
    </header>
  );
}
