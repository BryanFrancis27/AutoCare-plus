import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

type Props = { params: { expenseId: string } };

export default function ExpenseDetailsPage({ params }: Props) {
  return (
    <main className="flex-1 px-6 py-8 space-y-4">
      <PageHeader
        title="Expense details"
        description={`Expense ID: ${params.expenseId}`}
      />
      <Card className="p-4 space-y-2">
        <p className="text-textSecondary">Expense amount, category, linked maintenance record, and date.</p>
      </Card>
    </main>
  );
}
