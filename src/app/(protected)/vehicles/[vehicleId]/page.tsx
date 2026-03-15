import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getVehicleById } from "@/app/actions/vehicles";
import { getMaintenanceStats } from "@/app/actions/maintenance";
import { getAllReminders } from "@/app/actions/reminders";
import { VehicleDetailsClient } from "@/components/vehicles/VehicleDetailsClient";

type Props = { params: { vehicleId: string } };

export default async function VehicleDetailsPage({ params }: Props) {
  const { data: vehicle, error: vehicleError } = await getVehicleById(params.vehicleId);
  const { data: stats } = await getMaintenanceStats(params.vehicleId);
  const { data: allReminders } = await getAllReminders();
  
  // Filter upcoming reminders for this vehicle
  const upcomingReminders = allReminders?.filter(r => 
    r.vehicleId === params.vehicleId && !r.isCompleted && r.title
  ).slice(0, 5) || [];

  if (vehicleError || !vehicle) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-4">
        <PageHeader title="Vehicle Details" description="Loading..." />
        <Card className="p-6">
          <p className="text-red-600">Error loading vehicle: {vehicleError}</p>
        </Card>
      </main>
    );
  }

  return (
    <VehicleDetailsClient
      vehicle={vehicle}
      stats={stats}
      upcomingReminders={upcomingReminders as any}
    />
  );
}
