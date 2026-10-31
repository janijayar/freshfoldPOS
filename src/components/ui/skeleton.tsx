"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-border-muted",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        className
      )}
      style={{
        width,
        height,
        ...(variant === "text" && { width: "100%", height: "1rem" }),
      }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 space-y-4", className)} {...props}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={120} />
      <div className="flex items-center gap-2">
        <Skeleton variant="text" width="80px" />
        <Skeleton variant="text" width="60px" />
        <Skeleton variant="text" width="60px" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 space-y-3", className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton variant="text" width="50%" className="text-2xl" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5, className, ...props }: { rows?: number; columns?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("overflow-x-auto", className)} {...props}>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-text-muted border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="pb-3 font-medium">
                <Skeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-accent-muted/50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="py-3">
                  <Skeleton variant="text" width={colIndex === 0 ? "60%" : "80%"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ items = 5, className, ...props }: { items?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="30%" />
          </div>
          <Skeleton variant="text" width="80px" className="text-right" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonReceiptDetail({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-1">
            <Skeleton variant="text" width="200px" />
            <Skeleton variant="text" width="150px" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="100px" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      <SkeletonCard />
    </div>
  );
}

export function SkeletonPOS({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-full flex flex-col", className)} {...props}>
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Skeleton variant="text" width="150px" />
          <Skeleton variant="text" width="80px" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border bg-surface">
            <Skeleton variant="text" width="100%" className="max-w-md" />
          </div>
          <div className="p-2 border-b border-border bg-surface">
            <div className="flex gap-1">
              {["All", "Cat 1", "Cat 2", "Cat 3", "Cat 4"].map((_, i) => (
                <Skeleton key={i} variant="text" width="80px" height={36} />
              ))}
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={96} />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 border-l border-border bg-surface-elevated flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="100px" />
              <Skeleton variant="text" width="80px" />
            </div>
          </div>
          <div className="flex-1 p-4">
            <SkeletonList items={5} />
          </div>
          <div className="p-4 border-t border-border bg-surface-elevated/50 space-y-3">
            <div className="flex justify-between">
              <Skeleton variant="text" width="80px" />
              <Skeleton variant="text" width="80px" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="text" width="80px" />
              <Skeleton variant="text" width="80px" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="text" width="80px" className="text-lg" />
              <Skeleton variant="text" width="80px" className="text-lg" />
            </div>
            <div className="flex gap-2">
              <Skeleton variant="rectangular" className="flex-1" height={40} />
              <Skeleton variant="rectangular" className="flex-1" height={40} />
            </div>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="rectangular" className="w-full" height={48} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonShifts({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton variant="text" width="150px" className="text-3xl" />
          <Skeleton variant="text" width="250px" />
        </div>
        <Skeleton variant="rectangular" width={150} height={40} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonCard>
        <div className="flex flex-row items-center justify-between p-4">
          <Skeleton variant="text" width="120px" />
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width="120px" />
            <Skeleton variant="text" width="120px" />
            <Skeleton variant="text" width="100px" />
            <Skeleton variant="text" width="100px" />
          </div>
        </div>
        <SkeletonTable rows={5} columns={10} />
      </SkeletonCard>
    </div>
  );
}