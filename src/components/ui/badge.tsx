"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: () => void;
}

const badgeVariants = {
  variant: {
    default: "bg-accent-muted text-accent",
    success: "bg-success-muted text-success",
    danger: "bg-danger-muted text-danger",
    warning: "bg-warning-muted text-warning",
    info: "bg-info-muted text-info",
    outline: "bg-transparent text-text border border-border",
    secondary: "bg-surface-elevated text-text border border-border",
  },
  size: {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  },
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", removable, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full",
          badgeVariants.variant[variant],
          badgeVariants.size[size],
          removable && "pr-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10",
          className
        )}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label={`Remove ${children}`}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };