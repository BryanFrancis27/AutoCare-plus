import { Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { PageHeader } from "@/components/layout";

type Props = { params: { vehicleId: string } };

export default function AddReminderPage({ params }: Props) {
  return (
    <main className="flex-1 px-6 py-8 space-y-6">
      <PageHeader
        title="Add reminder"
        description={`Create a reminder for vehicle ${params.vehicleId}.`}
      />
      <Card className="p-6 space-y-4">
        <FormField label="Reminder type" htmlFor="reminderType">
          <Input id="reminderType" name="reminderType" placeholder="Oil change" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Due date" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" />
          </FormField>
          <FormField label="Mileage" htmlFor="mileage">
            <Input id="mileage" name="mileage" placeholder="50000" />
          </FormField>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" href="/reminders">Cancel</Button>
          <Button>Save reminder</Button>
        </div>
      </Card>
    </main>
  );
}
