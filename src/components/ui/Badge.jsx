// src/components/ui/Badge.js
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Badge = forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      secondary:
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      destructive:
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      outline:
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-300",
      success:
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      warning:
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };

    return (
      <span ref={ref} className={cn(variants[variant], className)} {...props} />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
