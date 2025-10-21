// src/components/ui/AlertDialog.jsx
"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { X } from "lucide-react";

const AlertDialogContext = createContext();

const AlertDialog = ({ children, open, onOpenChange }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <AlertDialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50">
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
          onClick={handleOverlayClick}
        />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]">
          {children}
        </div>
      </div>
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContent = ({ children, className = "" }) => {
  return (
    <div
      className={`
        w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-gray-200/60
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const AlertDialogHeader = ({ children, className = "" }) => {
  return <div className={`px-6 pt-6 pb-2 ${className}`}>{children}</div>;
};

const AlertDialogTitle = ({ children, className = "" }) => {
  return (
    <h2
      className={`text-lg font-semibold text-gray-900 leading-none tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
};

const AlertDialogDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

const AlertDialogFooter = ({ children, className = "" }) => {
  return (
    <div
      className={`px-6 pb-6 pt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 ${className}`}
    >
      {children}
    </div>
  );
};

const AlertDialogAction = ({
  children,
  onClick,
  className = "",
  variant = "default",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";

  const variants = {
    default:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ children, onClick, className = "", ...props }) => {
  const { onOpenChange } = useContext(AlertDialogContext);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg text-sm font-medium 
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
        px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 
        hover:border-gray-400 focus-visible:ring-gray-500
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};
