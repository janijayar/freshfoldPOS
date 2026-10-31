"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;
const TabsListPrimitive = TabsPrimitive.List;
const TabsTriggerPrimitive = TabsPrimitive.Trigger;
const TabsContentPrimitive = TabsPrimitive.Content;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsListPrimitive>,
  React.ComponentPropsWithoutRef<typeof TabsListPrimitive> & { mobile?: boolean }
>(({ className, mobile, ...props }, ref) => (
  <TabsListPrimitive
    ref={ref}
    className={cn(
      "flex h-10 items-center justify-center bg-surface border-t-border",
      mobile && "fixed bottom-0 left-0 right-0 z-50 h-tab-bar",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsListPrimitive.displayName;

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsTriggerPrimitive> {
  icon?: React.ReactNode;
  badge?: string | number;
  mobile?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, icon, badge, mobile, children, ...props }, ref) =>
    React.createElement(
      TabsTriggerPrimitive,
      {
        ref,
        className: cn(
          "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus data-[state=active]:text-accent data-[state=inactive]:text-text-muted",
          mobile
            ? "flex-1 flex flex-col py-1.5 text-xs"
            : "px-3 py-1.5 text-sm",
          className
        ),
        ...props,
      },
      icon && React.createElement("span", { className: cn("h-5 w-5", mobile && "mb-0.5") }, icon),
      children,
      badge != null &&
        React.createElement(
          "span",
          {
            className: cn(
              "absolute -top-1 -right-1 min-w-5 h-5 bg-danger text-on-accent text-[10px] font-bold rounded-full flex items-center justify-center px-1",
              mobile && "top-0.5 right-0.5"
            ),
          },
          badge
        )
    )
);
TabsTrigger.displayName = TabsTriggerPrimitive.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof TabsContentPrimitive>
>(({ className, ...props }, ref) =>
  React.createElement(
    TabsContentPrimitive,
    {
      ref,
      className: cn("flex-1 overflow-auto", className),
      ...props,
    }
  )
);
TabsContent.displayName = TabsContentPrimitive.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };