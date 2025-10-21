// src/components/ui/Loading.js
import { cn } from "@/lib/utils";

export function Loading({ className, size = "default" }) {
  const sizes = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingSpinner({ text = "Loading...", className }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="flex flex-col items-center gap-3">
        <Loading size="lg" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
