"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui";
import { Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function EmailConfirmationModal({ isOpen, onClose, email }: EmailConfirmationModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-20 h-20 bg-gradient-to-br from-redPrimary/10 to-redPrimary/5 rounded-full flex items-center justify-center mb-6"
        >
          <Mail className="w-10 h-10 text-redPrimary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="text-2xl font-semibold text-ink mb-3">
            Verify your email
          </h3>
          <p className="text-textSecondary mb-2">
            We&apos;ve sent a confirmation email to:
          </p>
          <p className="text-ink font-medium mb-6">
            {email}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-left"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-textSecondary">
              Click the confirmation link in the email to activate your account
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-textSecondary">
                Check your spam folder if you don&apos;t see it within a few minutes
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-textSecondary">
              The link will expire in 24 hours
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-3"
        >
          <Button onClick={onClose} className="w-full">
            Got it
          </Button>
          <button
            onClick={() => window.location.href = "/login"}
            className="text-sm text-textSecondary hover:text-ink transition-colors duration-200"
          >
            Go to login page
          </button>
        </motion.div>
      </div>
    </Dialog>
  );
}
