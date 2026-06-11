"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Pencil,
  Users,
  ShieldCheck,
  Clock,
  Share2,
  BarChart3,
} from "lucide-react";

interface ElectionDetailNavProps {
  electionId: string;
}

const NAV_ITEMS = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Edit", href: "/edit", icon: Pencil },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Rules", href: "/rules", icon: ShieldCheck },
  { label: "Schedule", href: "/schedule", icon: Clock },
  { label: "Share", href: "/share", icon: Share2 },
  { label: "Results", href: "/results", icon: BarChart3 },
];

export function ElectionDetailNav({ electionId }: ElectionDetailNavProps) {
  const pathname = usePathname();
  const basePath = `/elections/${electionId}`;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] pb-px scrollbar-hide">
      {NAV_ITEMS.map((item) => {
        const href = `${basePath}${item.href}`;
        const isActive =
          item.href === ""
            ? pathname === basePath
            : pathname.startsWith(href);
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
