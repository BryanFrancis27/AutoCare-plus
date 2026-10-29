import { Button } from "@/components/ui";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-ink">Unauthorized</h1>
      <p className="text-textSecondary">You need to be signed in to view this page.</p>
      <Button href="/login">Go to login</Button>
    </main>
  );
}
