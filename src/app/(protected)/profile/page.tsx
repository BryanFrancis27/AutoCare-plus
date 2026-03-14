import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

export default function ProfilePage() {
  return (
    <main className="flex-1 px-6 py-8 space-y-4">
      <PageHeader
        title="Profile"
        description="Manage account settings."
      />
      <Card className="p-4 space-y-3">
        <div>
          <h2 className="font-semibold text-whitePure">User information</h2>
          <p className="text-sm text-textSecondary">Email and account details placeholder.</p>
        </div>
        <Button variant="secondary">Logout</Button>
      </Card>
    </main>
  );
}
