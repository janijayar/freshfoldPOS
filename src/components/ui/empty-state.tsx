"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline" | "ghost";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  illustration?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  illustration,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 space-y-4",
        className
      )}
    >
      {illustration ? (
        <div className="text-text-muted/50" aria-hidden="true">
          {illustration}
        </div>
      ) : icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-border-muted text-text-muted">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-medium text-text">{title}</h3>
        {description && (
          <p className="text-text-muted">{description}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {action && (
          <Button
            variant={action.variant || "primary"}
            onClick={action.onClick}
            className="w-full sm:w-auto"
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick} className="w-full sm:w-auto">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyTableState({
  title = "No data",
  description = "Get started by adding your first item.",
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateProps["action"];
  className?: string;
}) {
  return (
    <tbody className={cn("divide-y divide-border", className)}>
      <tr>
        <td colSpan={99} className="py-12">
          <EmptyState title={title} description={description} icon={icon} action={action} />
        </td>
      </tr>
    </tbody>
  );
}

export function EmptyListState({
  title = "Nothing here yet",
  description = "When you add items, they'll appear here.",
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateProps["action"];
  className?: string;
}) {
  return (
    <div className={cn("h-full flex flex-col items-center justify-center", className)}>
      <EmptyState title={title} description={description} icon={icon} action={action} />
    </div>
  );
}