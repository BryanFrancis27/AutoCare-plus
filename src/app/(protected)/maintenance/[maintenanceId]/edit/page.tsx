import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { getMaintenanceRecordById } from "@/app/actions/maintenance";
import { EditMaintenanceForm } from "./EditMaintenanceForm";

type Props = { params: { maintenanceId: string } };

export default async function EditMaintenancePage({ params }: Props) {
  const { data: record, error } = await getMaintenanceRecordById(params.maintenanceId);

  if (error || !record) {
    return (
      <main className="flex-1 px-6 py-8 space-y-6">
        <PageHeader
          title="Edit Maintenance"
          description="Update maintenance record"
        />
        <Card className="p-6">
          <p className="text-red-600">Error loading maintenance record: {error || 'Record not found'}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-8 space-y-6">
      <PageHeader
        title="Edit Maintenance Record"
        description={`Update ${record.serviceType} record`}
      />
      <EditMaintenanceForm record={record} />
    </main>
  );
}

