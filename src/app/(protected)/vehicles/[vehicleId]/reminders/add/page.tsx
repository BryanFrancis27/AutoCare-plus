import { Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { PageHeader } from "@/components/layout";

type Props = { params: { vehicleId: string } };

export default function AddReminderPage({ params }: Props) {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="Add reminder"
        description={`Create a reminder for vehicle ${params.vehicleId}.`}
      />
      <Card className="p-4 sm:p-6 space-y-4">
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
        {/* Mobile adjustment: stack footer actions and keep full-width touch targets on phones */}
        <div className="flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-3">
          <Button variant="secondary" href="/reminders" className="w-full sm:w-auto">Cancel</Button>
          <Button className="w-full sm:w-auto">Save reminder</Button>
        </div>
      </Card>
    </main>
  );
}
