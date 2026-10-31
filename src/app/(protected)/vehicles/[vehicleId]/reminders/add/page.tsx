import { PageHeader } from '@/components/layout';
import { getVehicleById } from '@/app/actions/vehicles';
import { ReminderPageForm } from './ReminderPageForm';
export default async function AddReminderPage({ params }: { params: { vehicleId: string } }) {
  const { data: vehicle, error } = await getVehicleById(params.vehicleId);
  return <main className="application-workspace space-y-6"><PageHeader title="Add Reminder" description="Plan a service for your vehicle" />{error || !vehicle ? <p role="alert">Vehicle could not be loaded. Return to My Garage and try again.</p> : <ReminderPageForm vehicleId={vehicle.id} name={[vehicle.year, vehicle.make, vehicle.model, vehicle.plate_number].filter(Boolean).join(' ')} />}</main>;
}
