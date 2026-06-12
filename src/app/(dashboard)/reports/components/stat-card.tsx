"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "border-[var(--border)]",
  success: "border-emerald-500/30",
  warning: "border-amber-500/30",
  danger: "border-red-500/30",
};

const trendColors = {
  up: "text-emerald-500",
  down: "text-red-500",
  stable: "text-[var(--text-tertiary)]",
};

export function StatCard({
  label,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = "default",
}: StatCardProps) {
  return (
    <Card
      className={`bg-[var(--surface)] ${variantStyles[variant]} transition-all duration-200 hover:shadow-md`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {icon && (
              <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                {icon}
              </div>
            )}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {trend === "stable" && <Minus className="h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
