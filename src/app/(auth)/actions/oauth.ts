"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getOAuthRedirectBaseUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const requestHeaders = headers();
  const origin = requestHeaders.get("origin")?.trim().replace(/\/$/, "");

  if (origin) {
    return origin;
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error(
    "Unable to determine the application URL for Google OAuth. Set NEXT_PUBLIC_APP_URL in your deployment environment."
  );
}

export async function signInWithGoogle() {
  const supabase = createSupabaseServerClient();
  const redirectBaseUrl = getOAuthRedirectBaseUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectBaseUrl}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}
