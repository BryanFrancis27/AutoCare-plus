import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-ink">Page not found</h1>
      <p className="text-textSecondary">The page you are looking for does not exist.</p>
      <Button href="/">Back to home</Button>
    </main>
  );
}
