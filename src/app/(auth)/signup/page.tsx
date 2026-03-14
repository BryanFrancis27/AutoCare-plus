"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RegisterForm } from "../register/RegisterForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#D32F2F] rounded-full blur-[120px] opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#E53935] rounded-full blur-[120px] opacity-20" />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-0 mb-2">
              <span className="text-3xl font-bold text-white">AutoCare</span>
              <span className="text-3xl font-bold text-[#D32F2F]">+</span>
            </div>
          </Link>
          <p className="text-[#B0B0B0]">Create your account and start managing your vehicles.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-[#262626] border border-[#3A3A3A] rounded-2xl p-8 shadow-2xl"
        >
          <RegisterForm />

          <p className="text-center text-sm text-[#B0B0B0] mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#D32F2F] hover:text-[#E53935] transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
