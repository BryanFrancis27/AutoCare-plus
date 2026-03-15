import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getMaintenanceRecords } from "@/app/actions/maintenance";
import { formatDueDate, formatMileage, getPriorityColor } from "@/lib/maintenance";
import { formatCurrencyPHP } from "@/lib/currency";

type Props = { params: { vehicleId: string } };

export default async function MaintenanceLogsPage({ params }: Props) {
  const { data: records, error } = await getMaintenanceRecords(params.vehicleId);

  if (error) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-4">
        <PageHeader title="Maintenance Logs" description={`History for vehicle ${params.vehicleId}.`} />
        <Card className="p-6">
          <p className="text-red-600">Error loading maintenance records: {error}</p>
        </Card>
      </main>
    );
  }

  return (
    // Mobile adjustment: align maintenance page spacing with other protected pages.
    <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-4">
      <PageHeader
        title="Maintenance History"
        description="Complete service and maintenance records"
        actions={
          <Button href={`/vehicles/${params.vehicleId}/maintenance/add`} className="w-full sm:w-auto">
            Log Maintenance
          </Button>
        }
      />

      {records && records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="p-4">
              {/* Mobile adjustment: stack action button below details on narrow screens */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-textPrimary">{record.serviceType}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(record.priority)}`}>
                      {record.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary mt-1">{record.serviceCategory}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-textSecondary">Service Date</div>
                      <div className="text-sm font-medium">{formatDueDate(record.serviceDate)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-textSecondary">Mileage</div>
                      <div className="text-sm font-medium">{formatMileage(record.mileage)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-textSecondary">Cost</div>
                      <div className="text-sm font-medium">{formatCurrencyPHP(record.cost)}</div>
                    </div>
                    {record.nextDueDate && (
                      <div>
                        <div className="text-xs text-textSecondary">Next Due</div>
                        <div className="text-sm font-medium">{formatDueDate(record.nextDueDate)}</div>
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-textSecondary">
                      {record.notes}
                    </div>
                  )}
                </div>

                <div className="sm:ml-4">
                  <Button variant="secondary" href={`/maintenance/${record.id}/edit`} className="w-full sm:w-auto">
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-textPrimary mb-2">No Maintenance Records</h3>
          <p className="text-textSecondary mb-6">
            Start tracking your vehicle&apos;s maintenance history.
          </p>
          <Button href={`/vehicles/${params.vehicleId}/maintenance/add`}>Log First Maintenance</Button>
        </Card>
      )}
    </main>
  );
}
