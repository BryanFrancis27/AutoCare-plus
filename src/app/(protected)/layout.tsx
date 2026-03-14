import { ProtectedLayoutClient } from "@/components/layout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get user info
  const { data: userData } = await supabase.auth.getUser();
  const userName = userData?.user?.user_metadata?.full_name || userData?.user?.email?.split('@')[0];
  const userEmail = userData?.user?.email;

  return (
    <ProtectedLayoutClient userName={userName} userEmail={userEmail}>
      {children}
    </ProtectedLayoutClient>
  );
}
