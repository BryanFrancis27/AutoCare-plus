'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Car, Wrench, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatCurrencyPHP } from '@/lib/currency';
import { LoadingState } from '@/components/ui';

interface ServiceExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VehicleSummary {
  id: string;
  label: string;
  totalRecords: number;
  totalCost: number;
  lastService: string | null;
  recentServices: { serviceType: string; serviceDate: string; cost: number }[];
}

export function ServiceExpensesModal({ isOpen, onClose }: ServiceExpensesModalProps) {
  const [summaries, setSummaries] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, make, model, year')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!vehicles || vehicles.length === 0) {
        setSummaries([]);
        setLoading(false);
        return;
      }

      const results: VehicleSummary[] = await Promise.all(
        vehicles.map(async (v: any) => {
          const { data: logs } = await supabase
            .from('maintenance_logs')
            .select('service_type, service_date, cost')
            .eq('vehicle_id', v.id)
            .eq('user_id', user.id)
            .order('service_date', { ascending: false });

          const entries = logs ?? [];
          const totalCost = entries.reduce((sum: number, l: any) => sum + (Number(l.cost) || 0), 0);
          const lastService = entries.length > 0 ? entries[0].service_date : null;

          return {
            id: v.id,
            label: `${v.year} ${v.make} ${v.model}`,
            totalRecords: entries.length,
            totalCost,
            lastService,
            recentServices: entries.slice(0, 5).map((l: any) => ({
              serviceType: l.service_type,
              serviceDate: l.service_date,
              cost: Number(l.cost) || 0,
            })),
          };
        })
      );

      setSummaries(results);
      if (results.length > 0) setSelectedVehicleId(results[0].id);
      setLoading(false);
    });
  }, [isOpen]);

  const grandTotal = summaries.reduce((sum, s) => sum + s.totalCost, 0);
  const selected = summaries.find((s) => s.id === selectedVehicleId) ?? null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-canvas border border-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-line flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-redPrimary">
                    <DollarSign className="h-5 w-5 text-onAccent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Service & Expenses</h2>
                    <p className="text-xs text-textSecondary mt-0.5">Maintenance history across all vehicles</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surfaceHover rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-textSecondary" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {loading ? (
                  <LoadingState mode="container" label="Loading service and expense records..." />
                ) : error ? (
                  <div className="flex items-center gap-2 p-3 bg-redPrimary/10 border border-redPrimary/30 rounded-lg text-sm text-redPrimary">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                ) : summaries.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-14 w-14 mx-auto mb-3 text-grayBorder" />
                    <p className="text-ink font-medium">No vehicles found</p>
                    <p className="text-sm text-textSecondary mt-1">Add a vehicle to start tracking expenses</p>
                  </div>
                ) : (
                  <>
                    {/* Grand Total */}
                    <div className="bg-redPrimary/10 border border-redPrimary/30 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-redPrimary/20">
                        <TrendingUp className="h-5 w-5 text-redPrimary" />
                      </div>
                      <div>
                        <p className="text-xs text-textSecondary uppercase tracking-wide">Total Maintenance Spent</p>
                        <p className="text-2xl font-bold text-ink mt-0.5">{formatCurrencyPHP(grandTotal)}</p>
                      </div>
                    </div>

                    {/* Vehicle tabs */}
                    {summaries.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {summaries.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedVehicleId(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedVehicleId === s.id
                                ? 'bg-redPrimary text-onAccent'
                                : 'bg-surface text-textSecondary hover:text-ink'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected vehicle details */}
                    {selected && (
                      <div className="space-y-4">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-surface rounded-xl p-4">
                            <p className="text-xs text-textSecondary">Services</p>
                            <p className="text-2xl font-bold text-ink mt-1">{selected.totalRecords}</p>
                          </div>
                          <div className="bg-surface rounded-xl p-4">
                            <p className="text-xs text-textSecondary">Total Cost</p>
                            <p className="text-lg font-bold text-ink mt-1">{formatCurrencyPHP(selected.totalCost)}</p>
                          </div>
                          <div className="bg-surface rounded-xl p-4">
                            <p className="text-xs text-textSecondary">Last Service</p>
                            <p className="text-sm font-bold text-ink mt-1">
                              {selected.lastService
                                ? new Date(selected.lastService).toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'None'}
                            </p>
                          </div>
                        </div>

                        {/* Recent services */}
                        <div>
                          <h4 className="text-sm font-semibold text-ink mb-3">Recent Services</h4>
                          {selected.recentServices.length === 0 ? (
                            <p className="text-sm text-textSecondary">No service records yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {selected.recentServices.map((svc, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-3 bg-surface rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-redPrimary/20">
                                      <Wrench className="h-4 w-4 text-redPrimary" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-ink">{svc.serviceType}</p>
                                      <p className="text-xs text-textSecondary">
                                        {new Date(svc.serviceDate).toLocaleDateString('en-PH', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-semibold text-ink">
                                    {formatCurrencyPHP(svc.cost)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
