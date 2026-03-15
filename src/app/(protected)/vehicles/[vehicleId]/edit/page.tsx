import { Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { PageHeader } from "@/components/layout";

type Props = { params: { vehicleId: string } };

export default function EditVehiclePage({ params }: Props) {
  return (
    // Mobile adjustment: consistent page padding across protected routes.
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="Edit vehicle"
        description={`Update vehicle ${params.vehicleId}.`}
      />
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Make" htmlFor="make">
            <Input id="make" name="make" defaultValue="" />
          </FormField>
          <FormField label="Model" htmlFor="model">
            <Input id="model" name="model" defaultValue="" />
          </FormField>
          <FormField label="Year" htmlFor="year">
            <Input id="year" name="year" defaultValue="" />
          </FormField>
          <FormField label="Plate number" htmlFor="plate">
            <Input id="plate" name="plate" defaultValue="" />
          </FormField>
        </div>
        {/* Mobile adjustment: stack footer actions for smaller screens */}
        <div className="flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-3">
          <Button variant="secondary" href={`/vehicles/${params.vehicleId}`} className="w-full sm:w-auto">Cancel</Button>
          <Button className="w-full sm:w-auto">Update vehicle</Button>
        </div>
      </Card>
    </main>
  );
}
