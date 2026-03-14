import { Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { PageHeader } from "@/components/layout";

type Props = { params: { vehicleId: string } };

export default function EditVehiclePage({ params }: Props) {
  return (
    <main className="flex-1 px-6 py-8 space-y-6">
      <PageHeader
        title="Edit vehicle"
        description={`Update vehicle ${params.vehicleId}.`}
      />
      <Card className="p-6 space-y-4">
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
        <div className="flex justify-end gap-3">
          <Button variant="secondary" href={`/vehicles/${params.vehicleId}`}>Cancel</Button>
          <Button>Update vehicle</Button>
        </div>
      </Card>
    </main>
  );
}
