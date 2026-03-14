"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registerAction } from "./actions";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { EmailConfirmationModal } from "@/components/auth/EmailConfirmationModal";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, User, Mail, Lock } from "lucide-react";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Creating account..." : "Create Account"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, { error: undefined, success: false, email: "" });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Show email confirmation modal on successful registration
  useEffect(() => {
    if (state.success && state.email) {
      setShowEmailModal(true);
    }
  }, [state.success, state.email]);

  const passwordRequirements = [
    { text: "At least 6 characters", met: password.length >= 6 },
    { text: "One uppercase letter", met: /[A-Z]/.test(password) },
    { text: "One lowercase letter", met: /[a-z]/.test(password) },
    { text: "One number", met: /\d/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);

  return (
    <>
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

        {/* Display Name Input with Icon */}
        <div>
          <label htmlFor="displayName" className="block text-sm text-[#B0B0B0] mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
            <input
              id="displayName"
              type="text"
              name="displayName"
              placeholder="John Doe"
              required
              className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent transition-all"
            />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          
          {/* Password Requirements */}
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-3 space-y-2"
            >
              <p className="text-xs text-gray-400">Password requirements:</p>
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${
                      req.met ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      {req.met && <Check className="w-3 h-3 text-green-400" />}
                    </div>
                    <span className={`text-xs transition-colors duration-200 ${
                      req.met ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Confirm Password Input with Icon */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm text-[#B0B0B0] mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="••••••••"
              required
              className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg pl-11 pr-12 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#B0B0B0] hover:text-gray-200 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
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
        <SubmitButton disabled={!allRequirementsMet} />
      </form>

      <EmailConfirmationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={state.email || ""}
      />
    </>
  );
}
