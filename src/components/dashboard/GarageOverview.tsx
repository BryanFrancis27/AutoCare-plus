'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Car, ArrowUpRight } from 'lucide-react';
import { vehicleLabel, type GarageVehicle } from '../../services/dashboardService';

function VehiclePhoto({ src, single }: { src?: string | null; single: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showPhoto = Boolean(src && src !== failedSource);

  return <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-surfaceHover ${single ? 'dashboard-garage-photo-featured h-40 w-full' : 'h-24 w-24 rounded-lg'}`}>
    {showPhoto && src ? <Image
      src={src}
      alt=""
      fill
      unoptimized
      sizes={single ? '(min-width: 640px) 40vw, 100vw' : '96px'}
      className="object-cover"
      onError={() => setFailedSource(src)}
    /> : <span className="flex flex-col items-center gap-2 text-muted" aria-hidden="true">
      <Car className={single ? 'h-10 w-10' : 'h-8 w-8'} />
      {single && <span className="text-sm text-ink">{src ? 'Photo unavailable' : 'No photo added'}</span>}
    </span>}
  </span>;
}

export function GarageOverview({ vehicles, total }: { vehicles: GarageVehicle[]; total: number }) {
  const preview = vehicles.slice(0, 3);
  const single = total === 1;

  return <section className="card p-4 sm:p-6" aria-labelledby="garage-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="garage-title" className="text-lg font-semibold text-ink">Your garage <span className="ml-1 text-sm font-normal text-muted">{total} {total === 1 ? 'vehicle' : 'vehicles'}</span></h2>
        <p className="mt-1 text-sm leading-5 text-muted">{single ? 'Your vehicle, ready for its next chapter.' : 'A quick look at your most recently added vehicles.'}</p>
      </div>
      <Link href="/vehicles" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline">View garage<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div>
    <ul className={`mt-4 grid gap-3 ${single ? "grid-cols-1" : "dashboard-garage-grid"}`}>
      {preview.map(vehicle => <li key={vehicle.id} className="min-w-0">
        <Link href={`/vehicles/${vehicle.id}`} className={`grid h-full overflow-hidden rounded-xl border border-line bg-canvas transition-colors hover:border-accent/30 ${single ? 'dashboard-garage-single' : 'grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 p-3'}`}>
          <VehiclePhoto src={vehicle.image_url} single={single} />
          <div className={`min-w-0 ${single ? 'self-center p-4 sm:p-5' : ''}`}>
            <h3 className={`max-w-prose break-words font-semibold text-ink ${single ? 'text-xl' : 'text-base'}`}>{vehicleLabel(vehicle)}</h3>
            <p className="mt-1 break-words text-sm leading-5 text-muted">{vehicle.plate_number || 'Plate not added'}</p>
            <p className="mt-2 text-sm leading-5 text-muted">{vehicle.current_mileage != null ? `${vehicle.current_mileage.toLocaleString('en-PH')} km recorded` : 'Mileage not recorded'}</p>
            {single && <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">View vehicle details<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>}
          </div>
        </Link>
      </li>)}
    </ul>
    {total > 3 && <p className="mt-3 text-sm leading-5 text-muted">Showing 3 of {total} vehicles. Open your garage to see them all.</p>}
  </section>;
}
