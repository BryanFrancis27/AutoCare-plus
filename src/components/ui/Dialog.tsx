"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  // Mobile adjustment: allow full-screen dialogs on phones while keeping desktop max width.
  full: "max-w-6xl h-[92vh] sm:h-[90vh]",
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", containFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", containFocus);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, mounted]);

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
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />

          {/* Mobile adjustment: tighter outer padding on small screens */}
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-2 sm:p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-label={title ? undefined : "Dialog"}
              tabIndex={-1}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-containerBg rounded-2xl shadow-2xl border border-grayBorder w-full ${size === "full" ? "flex flex-col overflow-hidden" : "overflow-y-auto"} ${sizeClasses[size]} ${size !== "full" ? "max-h-[90vh]" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-grayBorder">
                  {title && <h2 id={titleId} className="text-lg sm:text-xl font-semibold text-ink break-words">{title}</h2>}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-surfaceHover transition-colors duration-200"
                      aria-label="Close dialog"
                    >
                      <X className="w-5 h-5 text-textSecondary" />
                    </button>
                  )}
                </div>
              )}

              <div className={`px-4 sm:px-6 py-4 ${size === "full" ? "flex-1 min-h-0" : ""}`}>{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return mounted && typeof document !== "undefined"
    ? createPortal(dialogContent, document.body)
    : null;
}
