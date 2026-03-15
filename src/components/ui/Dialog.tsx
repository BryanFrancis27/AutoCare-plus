"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  size?: "md" | "lg" | "xl" | "full";
}

const sizeClasses: Record<NonNullable<DialogProps["size"]>, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl h-[90vh]",
};

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = "md",
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure portal only renders on client after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-containerBg rounded-2xl shadow-2xl border border-grayBorder w-full ${size === "full" ? "flex flex-col overflow-hidden" : "overflow-y-auto"} ${sizeClasses[size]} ${size !== "full" ? "max-h-[90vh]" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-grayBorder">
                  {title && <h2 className="text-xl font-semibold text-whitePure">{title}</h2>}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors duration-200"
                      aria-label="Close dialog"
                    >
                      <X className="w-5 h-5 text-textSecondary" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={`px-6 py-4 ${size === "full" ? "flex-1 min-h-0" : ""}`}>{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to escape parent stacking/overflow contexts
  return mounted && typeof document !== "undefined"
    ? createPortal(dialogContent, document.body)
    : null;
}
