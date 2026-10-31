import { Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { getMaintenanceRecords } from '@/app/actions/maintenance';
import { getVehicleById } from '@/app/actions/vehicles';
import { MaintenanceHistory } from '@/components/maintenance/MaintenanceHistory';
export default async function MaintenanceLogsPage({ params }: { params: { vehicleId: string } }) {
  const [{ data: records, error }, { data: vehicle, error: vehicleError }] = await Promise.all([getMaintenanceRecords(params.vehicleId), getVehicleById(params.vehicleId)]);
  return <main className="application-workspace space-y-6 py-6 sm:py-8"><Button variant="secondary" href={'/vehicles/' + params.vehicleId}>Back to Vehicle</Button><PageHeader title="Maintenance History" description={vehicle ? [vehicle.year, vehicle.make, vehicle.model, vehicle.plate_number].filter(Boolean).join(' \u00b7 ') : 'Vehicle service records'} actions={vehicle && !vehicleError ? <Button href={'/vehicles/' + vehicle.id + '/maintenance/add'}>Log Maintenance</Button> : undefined} />
    {error || vehicleError || !records || !vehicle ? <div role="alert" className="card space-y-3 p-6"><p>Maintenance history could not be loaded completely. Totals are unavailable.</p><Button variant="secondary" href={'/vehicles/' + params.vehicleId + '/maintenance'}>Try again</Button></div> : <MaintenanceHistory records={records} vehicleId={vehicle.id} />}
  </main>;
}
