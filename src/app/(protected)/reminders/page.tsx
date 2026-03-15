import { getAllReminders } from "@/app/actions/reminders";
import { getUserVehicles } from "@/app/actions/vehicles";
import { RemindersListClient } from "@/components/reminders/RemindersListClient";

export default async function RemindersPage() {
  const [{ data: reminders, error: remindersError }, { data: vehicles, error: vehiclesError }] = await Promise.all([
    getAllReminders(),
    getUserVehicles(),
  ]);

  return (
    <RemindersListClient
      initialReminders={reminders ?? []}
      initialVehicles={vehicles ?? []}
      initialError={remindersError ?? vehiclesError}
    />
  );
}
