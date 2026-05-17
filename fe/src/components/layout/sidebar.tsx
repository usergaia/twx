"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Lamina<span className="text-muted-foreground"> AI</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                !item.ready && "opacity-70",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {!item.ready && item.week && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  W{item.week}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
        Smart Logistics Dashboard
      </div>
    </aside>
  );
}
