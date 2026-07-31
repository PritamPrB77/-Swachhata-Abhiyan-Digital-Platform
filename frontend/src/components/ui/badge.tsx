import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "accent" | "outline" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-sky-brand/15 text-sky-700 dark:text-sky-300",
        variant === "accent" && "bg-saffron/15 text-orange-700 dark:text-orange-300",
        variant === "outline" && "border border-border text-foreground",
        variant === "success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        variant === "warning" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        variant === "danger" && "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
        className,
      )}
      {...props}
    />
  );
}
