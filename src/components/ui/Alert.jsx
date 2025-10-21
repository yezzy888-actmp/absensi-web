// src/components/ui/Alert.jsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const Alert = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-background text-foreground border-border",
      destructive: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
      success:
        "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600",
      warning:
        "border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600",
      info: "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600",
    };

    const icons = {
      default: null,
      destructive: AlertCircle,
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
    };

    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
          variants[variant],
          className
        )}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {props.children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
