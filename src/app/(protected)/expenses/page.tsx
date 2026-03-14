import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

export default function ExpensesPage() {
  return (
    <main className="flex-1 px-6 py-8 space-y-4">
      <PageHeader
        title="Expenses"
        description="Overview of maintenance expenses."
      />
      <Card className="p-4">
        <p className="text-textSecondary">Expenses list placeholder with filters.</p>
      </Card>
    </main>
  );
}
