"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RegisterForm } from "../register/RegisterForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-4 py-6 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent rounded-full blur-[120px] opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent rounded-full blur-[120px] opacity-20" />

      {/* Mobile adjustment: allow extra width on medium devices for registration content */}
      <div className="w-full max-w-md sm:max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-0 mb-2">
              <span className="text-3xl font-bold text-ink">AutoCare</span>
              <span className="text-3xl font-bold text-accent">+</span>
            </div>
          </Link>
          <p className="text-muted">Create your account and start managing your vehicles.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-surface border border-line rounded-2xl p-5 sm:p-8 shadow-2xl"
        >
          <RegisterForm />

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent hover:text-accent transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
