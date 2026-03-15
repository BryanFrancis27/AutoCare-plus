'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { createMaintenanceRecord } from "@/app/actions/maintenance";
import { MAINTENANCE_CATEGORIES } from "@/lib/maintenance";

type Props = {
  vehicleId: string;
};

export function AddMaintenanceForm({ vehicleId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      vehicleId,
      serviceType: formData.get('serviceType') as string,
      serviceCategory: formData.get('serviceCategory') as string,
      serviceDate: formData.get('serviceDate') as string,
      mileage: parseInt(formData.get('mileage') as string),
      cost: parseFloat(formData.get('cost') as string) || 0,
      notes: formData.get('notes') as string || undefined,
    };

    const result = await createMaintenanceRecord(data);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/vehicles/${vehicleId}/maintenance`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Service Category" htmlFor="serviceCategory">
            <select
              id="serviceCategory"
              name="serviceCategory"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Select category...</option>
              {MAINTENANCE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Service Type" htmlFor="serviceType">
            <Input
              id="serviceType"
              name="serviceType"
              placeholder="e.g., Synthetic Oil Change"
              required
            />
          </FormField>

          <FormField label="Service Date" htmlFor="serviceDate">
            <Input
              id="serviceDate"
              name="serviceDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </FormField>

          <FormField label="Mileage (km)" htmlFor="mileage">
            <Input
              id="mileage"
              name="mileage"
              type="number"
              placeholder="50000"
              required
            />
          </FormField>

          <FormField label="Cost (₱)" htmlFor="cost">
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional service details, parts replaced, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Maintenance Record'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
