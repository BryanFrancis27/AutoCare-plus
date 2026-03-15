import { PageHeader } from "@/components/layout";
import { AddMaintenanceForm } from "./AddMaintenanceForm";

type Props = { params: { vehicleId: string } };

export default function AddMaintenancePage({ params }: Props) {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="Log Maintenance"
        description="Record a completed service or maintenance task"
      />
      <AddMaintenanceForm vehicleId={params.vehicleId} />
    </main>
  );
}
