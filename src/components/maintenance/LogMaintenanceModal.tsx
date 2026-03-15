'use client';

import { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createMaintenanceRecord } from '@/app/actions/maintenance';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MAINTENANCE_CATEGORIES } from '@/lib/maintenance';
import { LoadingState } from '@/components/ui';

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  vehicle?: VehicleOption | null;
  title?: string;
}

interface VehicleOption {
  id: string;
  label: string;
  currentMileage: number | null;
}

const serviceCategories = MAINTENANCE_CATEGORIES.map((c) => ({
  value: c.id,
  label: c.name,
}));

export function LogMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
  title,
}: LogMaintenanceModalProps) {
  const savingLabel = 'Saving maintenance record...';
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: '',
    serviceCategory: '',
    serviceType: '',
    serviceDate: new Date().toISOString().split('T')[0],
    mileage: '',
    cost: '',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    if (vehicle) {
      setVehicles([vehicle]);
      setForm((prev) => ({
        ...prev,
        vehicleId: vehicle.id,
        mileage: vehicle.currentMileage != null ? String(vehicle.currentMileage) : '',
      }));
      setLoadingVehicles(false);
      return;
    }

    setLoadingVehicles(true);
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('vehicles')
        .select('id, make, model, year, current_mileage')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setVehicles(
            (data ?? []).map((v: any) => ({
              id: v.id,
              label: `${v.year} ${v.make} ${v.model}`,
              currentMileage: v.current_mileage ?? null,
            }))
          );
          if (data && data.length > 0) {
            setForm((prev) => ({
              ...prev,
              vehicleId: data[0].id,
              mileage: String(data[0].current_mileage ?? ''),
            }));
          }
          setLoadingVehicles(false);
        });
    });
  }, [isOpen, vehicle]);

  const handleVehicleChange = (id: string) => {
    const selectedVehicle = vehicles.find((veh) => veh.id === id);
    setForm((prev) => ({
      ...prev,
      vehicleId: id,
      mileage: selectedVehicle?.currentMileage != null ? String(selectedVehicle.currentMileage) : '',
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = MAINTENANCE_CATEGORIES.find((c) => c.id === categoryId);
    setForm((prev) => ({
      ...prev,
      serviceCategory: categoryId,
      serviceType: category?.name ?? '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.vehicleId) return setError('Please select a vehicle.');
    if (!form.serviceCategory) return setError('Please select a service category.');
    if (!form.serviceType) return setError('Service type is required.');
    if (!form.serviceDate) return setError('Service date is required.');
    if (!form.mileage || isNaN(Number(form.mileage))) {
      return setError('A valid mileage is required.');
    }

    setSaving(true);
    const result = await createMaintenanceRecord({
      vehicleId: form.vehicleId,
      serviceType: form.serviceType,
      serviceCategory: form.serviceCategory,
      serviceDate: form.serviceDate,
      mileage: Number(form.mileage),
      cost: Number(form.cost) || 0,
      notes: form.notes || undefined,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setForm({
      vehicleId: vehicles[0]?.id ?? '',
      serviceCategory: '',
      serviceType: '',
      serviceDate: new Date().toISOString().split('T')[0],
      mileage: String(vehicles[0]?.currentMileage ?? ''),
      cost: '',
      notes: '',
    });
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    if (saving) {
      return;
    }
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
            onClick={() => {
              if (!saving) {
                handleClose();
              }
            }}
          />
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#1D1D1C] border border-[#3A3A3A] rounded-2xl shadow-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {saving && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/45 backdrop-blur-sm">
                  <LoadingState mode="container" label={savingLabel} className="min-h-[200px] w-[min(92%,420px)]" />
                </div>
              )}
              <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-redPrimary">
                    <Wrench className="h-5 w-5 text-whitePure" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-whitePure">{title ?? 'Log Maintenance'}</h2>
                    <p className="text-xs text-textSecondary mt-0.5">Record a service for your vehicle</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={saving}
                  className="p-2 hover:bg-[#262626] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-5 w-5 text-textSecondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-redPrimary/10 border border-redPrimary/30 rounded-lg text-sm text-redPrimary">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {!vehicle && (
                  <div>
                    <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                      Vehicle
                    </label>
                    {loadingVehicles ? (
                      <LoadingState mode="inline" label="Loading vehicles..." className="justify-start" />
                    ) : vehicles.length === 0 ? (
                      <p className="text-sm text-textSecondary">No vehicles found. Add a vehicle first.</p>
                    ) : (
                      <select
                        value={form.vehicleId}
                        onChange={(e) => handleVehicleChange(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm focus:outline-none focus:border-redPrimary"
                      >
                        {vehicles.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {vehicle && (
                  <div>
                    <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                      Vehicle
                    </label>
                    <div className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm">
                      {vehicle.label}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                    Service Category
                  </label>
                  <select
                    value={form.serviceCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm focus:outline-none focus:border-redPrimary"
                  >
                    <option value="">Select category...</option>
                    {serviceCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={form.serviceType}
                    onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value }))}
                    placeholder="e.g. Oil Change, Tire Rotation"
                    className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm placeholder-textSecondary focus:outline-none focus:border-redPrimary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                      Service Date
                    </label>
                    <input
                      type="date"
                      value={form.serviceDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, serviceDate: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm focus:outline-none focus:border-redPrimary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                      Mileage (km)
                    </label>
                    <input
                      type="number"
                      value={form.mileage}
                      onChange={(e) => setForm((prev) => ({ ...prev, mileage: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm placeholder-textSecondary focus:outline-none focus:border-redPrimary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                    Cost (₱)
                  </label>
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm placeholder-textSecondary focus:outline-none focus:border-redPrimary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-textSecondary uppercase tracking-wide mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-[#262626] border border-[#3A3A3A] rounded-lg text-whitePure text-sm placeholder-textSecondary focus:outline-none focus:border-redPrimary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-[#262626] hover:bg-[#303030] text-whitePure text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || vehicles.length === 0}
                    className="flex-1 px-4 py-2.5 bg-redPrimary hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-whitePure text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? savingLabel : 'Log Maintenance'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
