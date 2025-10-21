// src/components/ui/dialog.jsx
"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { X } from "lucide-react";

const DialogContext = createContext();

const Dialog = ({ children, open, onOpenChange }) => {
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
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50">
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
          onClick={handleOverlayClick}
        />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
};

const DialogContent = ({ children, className = "" }) => {
  const { onOpenChange } = useContext(DialogContext);

  return (
    <div
      className={`
        bg-white rounded-xl shadow-2xl border border-gray-200/60 mx-4
        max-h-[90vh] overflow-hidden flex flex-col
        ${className}
      `}
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = "" }) => {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = "" }) => {
  return (
    <h2
      className={`text-xl font-semibold text-gray-900 leading-none tracking-tight pr-8 ${className}`}
    >
      {children}
    </h2>
  );
};

const DialogDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

const DialogBody = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 flex-1 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

const DialogFooter = ({ children, className = "" }) => {
  return (
    <div
      className={`px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 ${className}`}
    >
      {children}
    </div>
  );
};

// Button components for consistency
const DialogTrigger = ({ children, onClick, className = "", ...props }) => {
  return (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const DialogClose = ({
  children,
  onClick,
  className = "",
  variant = "outline",
  ...props
}) => {
  const { onOpenChange } = useContext(DialogContext);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      onOpenChange(false);
    }
  };

  const baseClasses =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";

  const variants = {
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
  DialogClose,
};
