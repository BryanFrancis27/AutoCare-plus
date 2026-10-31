"use client";

import { GuardedLink } from "./NavigationGuard";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LayoutDashboard, Car, Bell, User, X } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const media = window.matchMedia("(min-width: 1024px)");
    if (media.matches) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      // Portalled confirmation dialogs manage their own Escape handling.
      if (!sidebarRef.current?.contains(document.activeElement)) return;
      if (event.key === "Escape") { event.preventDefault(); setSidebarOpen(false); }
      if (event.key !== "Tab") return;
      const targets = Array.from(sidebarRef.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')).filter(el => el.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const handleResize = () => { if (media.matches) setSidebarOpen(false); };
    document.addEventListener("keydown", handleKey);
    media.addEventListener("change", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      media.removeEventListener("change", handleResize);
      if (previousFocus?.isConnected && !media.matches) previousFocus.focus();
    };
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <aside
        id="application-navigation"
        ref={sidebarRef}
        aria-label="Application navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface pt-16 shadow-card lg:visible ${sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"} transition-transform duration-200 lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 pb-3 pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Your garage</p>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-3 text-muted hover:bg-surfaceHover lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-1">
            {navItems.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return <GuardedLink key={item.href} href={item.href} onNavigate={() => setSidebarOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${active ? "border-accent/15 bg-accentSoft text-accent" : "border-transparent text-muted hover:bg-surfaceHover hover:text-ink"}`}>
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />{item.label}
              </GuardedLink>;
            })}
          </div>
        </nav>
        <div className="border-t border-line p-3"><LogoutButton /></div>
      </aside>
    </>
  );
}
