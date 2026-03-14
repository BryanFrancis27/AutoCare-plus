"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerAction(
  _prevState: { error?: string; success?: boolean; email?: string },
  formData: FormData
): Promise<{ error?: string; success?: boolean; email?: string }> {
  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  if (!displayName || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  // Validate password requirements
  if (!/[A-Z]/.test(password)) {
    return { error: "Password must contain at least one uppercase letter." };
  }

  if (!/[a-z]/.test(password)) {
    return { error: "Password must contain at least one lowercase letter." };
  }

  if (!/\d/.test(password)) {
    return { error: "Password must contain at least one number." };
  }

  const supabase = createSupabaseServerClient();
  
  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        display_name: displayName,
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  // Return success with email for confirmation modal
  return { success: true, email };
}
