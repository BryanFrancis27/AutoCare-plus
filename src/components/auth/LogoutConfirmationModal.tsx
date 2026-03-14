"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui";
import { LogOut, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmationModal({ isOpen, onClose, onConfirm }: LogoutConfirmationModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    await onConfirm();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Confirm Logout">
      <div className="py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-redPrimary/10 rounded-full flex-shrink-0">
              <LogOut className="w-6 h-6 text-redPrimary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-whitePure mb-2">
                Are you sure you want to logout?
              </h3>
              <p className="text-sm text-textSecondary">
                You will need to sign in again to access your AutoCare+ account and vehicle information.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-start gap-3 bg-redPrimary/10 border border-redPrimary/30 rounded-lg p-3 mb-6"
        >
          <AlertCircle className="w-5 h-5 text-redPrimary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-textSecondary">
            Make sure you have saved any changes before logging out.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex gap-3"
        >
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 px-4 py-3 border border-grayBorder rounded-xl text-sm font-medium text-whitePure bg-containerBg hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-redPrimary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="flex-1 px-4 py-3 border border-transparent rounded-xl text-sm font-medium text-whitePure bg-redPrimary hover:bg-redPrimaryHover focus:outline-none focus:ring-2 focus:ring-redPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoggingOut ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging out...
              </span>
            ) : (
              "Confirm Logout"
            )}
          </button>
        </motion.div>
      </div>
    </Dialog>
  );
}
