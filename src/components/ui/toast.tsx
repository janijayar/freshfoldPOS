"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-4 right-4 flex flex-col gap-2 z-toast w-full max-w-sm sm:bottom-6 sm:right-6 sm:flex-row sm:items-end sm:p-4",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
  variant?: "default" | "success" | "error" | "warning" | "info";
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-surface text-text border-border",
      success: "bg-success-muted text-success border-success/20",
      error: "bg-danger-muted text-danger border-danger/20",
      warning: "bg-warning-muted text-warning border-warning/20",
      info: "bg-info-muted text-info border-info/20",
    };

    const icons = {
      default: null,
      success: <CheckCircle className="h-5 w-5 text-success" />,
      error: <AlertCircle className="h-5 w-5 text-danger" />,
      warning: <AlertTriangle className="h-5 w-5 text-warning" />,
      info: <Info className="h-5 w-5 text-info" />,
    };

    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-xl min-w-[300px] max-w-[480px] animate-slide-in",
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 flex-1">
          {icons[variant] && <div className="flex-shrink-0">{icons[variant]}</div>}
          <div className="grid gap-1">
            <ToastPrimitive.Title className="text-sm font-semibold text-text" />
            <ToastPrimitive.Description className="text-sm text-text-muted/90" />
          </div>
        </div>
        <ToastPrimitive.Close className="flex-shrink-0 text-text-muted/50 hover:text-text focus:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  }
);
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn("", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

type ToastActionElement = React.ElementRef<typeof ToastPrimitive.Action>;

const ToastAction = React.forwardRef<ToastActionElement, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>>(
  ({ className, ...props }, ref) => (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-accent px-3 text-sm font-semibold text-on-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-border-focus disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-text-muted/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-border-focus",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  type ToastProps,
};