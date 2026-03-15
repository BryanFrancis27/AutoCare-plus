import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConnectionCheckPage() {
  const urlSet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const keySet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = createSupabaseServerClient();

  // Try a lightweight query; if RLS blocks, we'll at least confirm connectivity via error.
  const { data, error } = await supabase
    .from("vehicles")
    .select("id")
    .limit(1);

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 space-y-4">
      <h1 className="text-xl font-semibold">Supabase Connection Check</h1>

      <section className="space-y-1">
        <p>Env URL: {urlSet ? "set" : "missing"}</p>
        <p>Env ANON KEY: {keySet ? "set" : "missing"}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Vehicles Query</h2>
        {error && (
          <div className="text-red-600">
            Error: {error.message}
          </div>
        )}
        {!error && (
          <div className="text-green-700">
            Query OK. Rows returned: {Array.isArray(data) ? data.length : 0}
          </div>
        )}
      </section>

      <p className="text-sm text-gray-600">
        Note: If Row Level Security is enabled and there are no select policies for
        anonymous users, this may show an authorization error. That still confirms
        connectivity; add policies or sign in to see data.
      </p>
    </main>
  );
}

