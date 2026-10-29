'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Car } from 'lucide-react';
import { usableVehiclePhoto } from '@/lib/vehicles/garage-model';

export function VehicleImage({ src, name, compact = false, featured = false }: { src?: string | null; name: string; compact?: boolean; featured?: boolean }) {
  const source = usableVehiclePhoto(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <div className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-canvas ${featured ? "garage-vehicle-image-featured" : ""} ${compact ? 'h-[72px] w-[72px] rounded-lg border border-line' : 'aspect-video w-full border-b border-line'}`}>
    {source && source !== failedSource ? <Image src={source} alt={`Photo of ${name}`} fill unoptimized sizes={compact ? '72px' : '(min-width: 1536px) 400px, (min-width: 768px) 50vw, 100vw'} className="object-cover" onError={() => setFailedSource(source)} /> : <div className="flex flex-col items-center gap-2 text-muted">
      <Car className={compact ? 'h-7 w-7' : 'h-10 w-10'} aria-hidden="true" />
      {compact ? <span className="sr-only">Vehicle photo unavailable</span> : <p className="text-sm">{src ? 'Photo unavailable' : 'No photo added yet'}</p>}
    </div>}
  </div>;
}
