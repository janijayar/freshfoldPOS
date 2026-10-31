"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff, Lock, RefreshCw, Home } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  variant?: "default" | "network" | "permission" | "not-found" | "server";
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  className?: string;
}

const variantConfigs = {
  default: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
  network: {
    icon: WifiOff,
    title: "Connection lost",
    description: "Unable to reach the server. Check your internet connection and try again.",
  },
  permission: {
    icon: Lock,
    title: "Access denied",
    description: "You don't have permission to view this page. Contact your administrator if you believe this is a mistake.",
  },
  "not-found": {
    icon: AlertCircle,
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
  },
  server: {
    icon: AlertCircle,
    title: "Server error",
    description: "Our servers are experiencing issues. Please try again in a few minutes.",
  },
};

export function ErrorState({
  title,
  description,
  variant = "default",
  onRetry,
  onGoHome,
  showRetry = true,
  showHome = true,
  className,
}: ErrorStateProps) {
  const config = variantConfigs[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 space-y-4",
        className
      )}
      role="alert"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-muted">
        <Icon className="h-8 w-8 text-danger" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md">
        <h2 className="text-xl font-semibold text-text">{title || config.title}</h2>
        <p className="text-text-muted">{description || config.description}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {showRetry && onRetry && (
          <Button onClick={onRetry} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
        )}
        {showHome && onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="w-full sm:w-auto">
            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}

export function InlineError({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 text-sm text-danger bg-danger-muted rounded-md",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-danger hover:text-danger/70 transition-colors"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function PageErrorBoundary({
  children,
  fallback,
  variant = "default",
  onRetry,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: ErrorStateProps["variant"];
  onRetry?: () => void;
}) {
  return (
    <ErrorBoundary
      fallback={fallback || (
        <ErrorState
          variant={variant}
          onRetry={onRetry}
          onGoHome={() => window.location.href = "/dashboard"}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}