"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, { error: undefined });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="space-y-5" action={formAction}>
      {/* Google Button First */}
      <GoogleOAuthButton />
      
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#3A3A3A]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#262626] px-4 text-[#B0B0B0]">Or continue with email</span>
        </div>
      </div>

      {/* Email Input with Icon */}
      <div>
        <label htmlFor="email" className="block text-sm text-[#B0B0B0] mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Password Input with Icon */}
      <div>
        <label htmlFor="password" className="block text-sm text-[#B0B0B0] mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            required
            className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg pl-11 pr-12 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#B0B0B0] hover:text-gray-200 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[#B0B0B0] cursor-pointer">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="w-4 h-4 rounded border-[#3A3A3A] bg-[#1D1D1C]"
          />
          Remember me
        </label>
        <a href="#" className="text-[#D32F2F] hover:text-[#E53935] transition-colors">
          Forgot password?
        </a>
      </div>

      {/* Error Message */}
      {state.error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3" 
          role="alert"
        >
          {state.error}
        </motion.p>
      )}

      {/* Submit Button */}
      <SubmitButton />
    </form>
  );
}
