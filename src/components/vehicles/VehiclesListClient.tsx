"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Car, Plus, Calendar, Wrench, Pencil, Trash2, Eye } from "lucide-react";
import { AddVehicleModal } from "@/components/vehicles/AddVehicleModal";
import { LogMaintenanceModal } from "@/components/maintenance/LogMaintenanceModal";
import { Dialog, LoadingState } from "@/components/ui";
import { deleteVehicle } from "@/app/actions/vehicles";
import { useRouter } from "next/navigation";
import { formatCurrencyPHP } from "@/lib/currency";
import { getVehicleServiceHistory, type ServiceHistoryEntry } from "@/app/actions/maintenance";
import { formatDueDate } from "@/lib/maintenance";

type VehicleListItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string | null;
  color?: string | null;
  vehicle_type?: string | null;
  powertrain?: string | null;
  transmission?: string | null;
  current_mileage: number | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  notes?: string | null;
  image_url?: string | null;
};

type VehiclesListClientProps = {
  vehicles: VehicleListItem[];
  error?: string | null;
};

export function VehiclesListClient({ vehicles, error }: VehiclesListClientProps) {
  const router = useRouter();
  const [localVehicles, setLocalVehicles] = useState<VehicleListItem[]>(vehicles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicleToView, setVehicleToView] = useState<VehicleListItem | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<VehicleListItem | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleListItem | null>(null);
  const [vehicleToLogMaintenance, setVehicleToLogMaintenance] = useState<VehicleListItem | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<VehicleListItem | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ServiceHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLocalVehicles(vehicles);
  }, [vehicles]);

  const expenseSummary = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return historyEntries.reduce(
      (totals, entry) => {
        const cost = Number(entry.cost) || 0;
        const dateParts = entry.serviceDate.split("-").map(Number);
        const serviceDate =
          dateParts.length >= 3
            ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
            : new Date(entry.serviceDate);

        if (Number.isNaN(serviceDate.getTime())) {
          return totals;
        }

        if (serviceDate.getFullYear() === currentYear) {
          totals.yearlyTotal += cost;

          if (serviceDate.getMonth() === currentMonth) {
            totals.monthlyTotal += cost;
          }
        }

        return totals;
      },
      { monthlyTotal: 0, yearlyTotal: 0 }
    );
  }, [historyEntries]);

  const normalizeVehicle = (vehicle: any): VehicleListItem => ({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate_number: vehicle.plate_number ?? vehicle.license_plate ?? null,
    color: vehicle.color ?? null,
    vehicle_type: vehicle.vehicle_type ?? null,
    powertrain: vehicle.powertrain ?? null,
    transmission: vehicle.transmission ?? null,
    current_mileage: vehicle.current_mileage ?? null,
    purchase_date: vehicle.purchase_date ?? null,
    purchase_price: vehicle.purchase_price ?? null,
    notes: vehicle.notes ?? null,
    image_url: vehicle.image_url ?? vehicle.photo_url ?? vehicle.image ?? null,
  });

  const upsertLocalVehicle = (vehicle: any) => {
    const normalized = normalizeVehicle(vehicle);
    setLocalVehicles((prev) => {
      const index = prev.findIndex((item) => item.id === normalized.id);
      if (index === -1) {
        return [normalized, ...prev];
      }
      const copy = [...prev];
      copy[index] = { ...copy[index], ...normalized };
      return copy;
    });
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    setActionError(null);
    const result = await deleteVehicle(vehicleToDelete.id);
    setIsDeleting(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setLocalVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleToDelete.id));
    setVehicleToDelete(null);
    router.refresh();
  };

  const openServiceHistory = async (vehicle: VehicleListItem) => {
    setHistoryVehicle(vehicle);
    setHistoryEntries([]);
    setHistoryError(null);
    setIsHistoryLoading(true);

    const result = await getVehicleServiceHistory(vehicle.id);
    setIsHistoryLoading(false);

    if (result.error) {
      setHistoryError(result.error);
      return;
    }

    setHistoryEntries(result.data ?? []);
  };

  const openLogMaintenance = (vehicle: VehicleListItem) => {
    setVehicleToLogMaintenance(vehicle);
  };

  return (
    <>
      {/* Mobile adjustment: compact padding and stacked header actions on small screens */}
      <div className="px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink mb-1">My Vehicles</h1>
            <p className="text-muted">Manage your vehicle fleet and track maintenance.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-accent hover:bg-accentHover text-onAccent px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-accent rounded-xl p-4">
            {error}
          </div>
        )}

        {actionError && (
          <div className="bg-red-500/10 border border-red-500/30 text-accent rounded-xl p-4">
            {actionError}
          </div>
        )}

        {!error && localVehicles.length === 0 && (
          <div className="bg-surface border border-line rounded-xl p-8 text-center">
            <Car className="w-10 h-10 text-muted mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-ink">No vehicles yet</h2>
            <p className="text-muted mt-1">Add your first vehicle to start tracking maintenance.</p>
          </div>
        )}

        {!error && localVehicles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {localVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-surface border border-line rounded-xl p-4 sm:p-6 shadow-lg"
              >
                {/* Mobile adjustment: card heading wraps with action group below on narrow widths */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {vehicle.image_url ? (
                      <Image
                        src={vehicle.image_url}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-12 h-12 rounded-lg object-cover border border-line"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                        <Car className="w-6 h-6 text-onAccent" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-ink break-words">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted">{vehicle.plate_number || "No plate"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-success">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setVehicleToView(vehicle);
                      }}
                      className="p-2 bg-canvas hover:bg-surfaceHover text-ink rounded-lg transition-colors border border-line"
                      aria-label="View vehicle"
                      title="View vehicle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setVehicleToEdit(vehicle);
                      }}
                      className="p-2 bg-canvas hover:bg-surfaceHover text-ink rounded-lg transition-colors border border-line"
                      aria-label="Edit vehicle"
                      title="Edit vehicle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setVehicleToDelete(vehicle);
                      }}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-accent rounded-lg transition-colors border border-red-500/30"
                      aria-label="Delete vehicle"
                      title="Delete vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                    <span className="text-muted">Mileage</span>
                    <span className="text-ink font-medium">
                      {vehicle.current_mileage?.toLocaleString() ?? "N/A"} miles
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-canvas rounded-lg">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span className="text-sm text-ink">Add service records to generate reminders</span>
                  </div>
                </div>

                {/* Mobile adjustment: action buttons stack for better tap targets on phones */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => openServiceHistory(vehicle)}
                    className="autocare-button flex-1 flex items-center justify-center gap-2 bg-canvas text-ink px-4 py-2 rounded-lg transition-all duration-200 ease-out border border-line"
                  >
                    <Wrench className="w-4 h-4" />
                    Service & Expenses
                  </button>
                  <button
                    type="button"
                    onClick={() => openLogMaintenance(vehicle)}
                    className="autocare-button flex-1 flex items-center justify-center gap-2 bg-accent text-onAccent px-4 py-2 rounded-lg transition-all duration-200 ease-out"
                  >
                    <Calendar className="w-4 h-4" />
                    Log Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={upsertLocalVehicle}
      />
      <AddVehicleModal
        isOpen={Boolean(vehicleToEdit)}
        onClose={() => setVehicleToEdit(null)}
        mode="edit"
        vehicle={vehicleToEdit}
        onSaved={upsertLocalVehicle}
      />

      <Dialog
        isOpen={Boolean(vehicleToView)}
        onClose={() => setVehicleToView(null)}
        title="Vehicle Details"
      >
        {vehicleToView && (
          <div className="space-y-4">
            {/* Mobile adjustment: stack media and text to prevent clipping in details dialog */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {vehicleToView.image_url ? (
                <Image
                  src={vehicleToView.image_url}
                  alt={`${vehicleToView.year} ${vehicleToView.make} ${vehicleToView.model}`}
                  width={72}
                  height={72}
                  unoptimized
                  className="w-[72px] h-[72px] rounded-lg object-cover border border-line"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-lg bg-accent flex items-center justify-center">
                  <Car className="w-8 h-8 text-onAccent" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {vehicleToView.year} {vehicleToView.make} {vehicleToView.model}
                </h3>
                <p className="text-sm text-muted">{vehicleToView.plate_number || "No plate"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Mileage</p>
                <p className="text-ink font-medium">{vehicleToView.current_mileage?.toLocaleString() ?? "N/A"} miles</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Vehicle Type</p>
                <p className="text-ink font-medium capitalize">{vehicleToView.vehicle_type || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Powertrain</p>
                <p className="text-ink font-medium capitalize">{vehicleToView.powertrain || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Transmission</p>
                <p className="text-ink font-medium">{vehicleToView.transmission || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Color</p>
                <p className="text-ink font-medium">{vehicleToView.color || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Purchase Date</p>
                <p className="text-ink font-medium">{vehicleToView.purchase_date || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Purchase Price</p>
                <p className="text-ink font-medium">
                  {vehicleToView.purchase_price != null ? formatCurrencyPHP(vehicleToView.purchase_price) : "Not set"}
                </p>
              </div>
            </div>

            <div className="bg-canvas rounded-lg p-3">
              <p className="text-muted text-sm">Notes</p>
              <p className="text-ink text-sm mt-1 whitespace-pre-wrap">{vehicleToView.notes || "No notes"}</p>
            </div>

            <div className="flex justify-stretch sm:justify-end">
              <button
                type="button"
                onClick={() => setVehicleToView(null)}
                className="w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accentHover text-onAccent rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={Boolean(historyVehicle)}
        onClose={() => setHistoryVehicle(null)}
        title={historyVehicle ? `${historyVehicle.year} ${historyVehicle.make} ${historyVehicle.model} Service & Expenses` : "Service & Expenses"}
        size="full"
      >
        <div className="space-y-4">
          {isHistoryLoading && (
            <LoadingState mode="container" label="Loading service history..." className="min-h-[220px]" />
          )}

          {historyError && (
            <div className="bg-red-500/10 border border-red-500/30 text-accent rounded-xl p-4 text-sm">
              {historyError}
            </div>
          )}

          {!isHistoryLoading && !historyError && (
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="text-base font-semibold text-ink">Service History</h3>

                {historyEntries.length === 0 && (
                  <div className="bg-canvas border border-line rounded-xl p-6 text-center">
                    <p className="text-muted text-sm">No service history yet for this vehicle.</p>
                  </div>
                )}

                {historyEntries.length > 0 && (
                  <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                    {historyEntries.map((entry) => (
                      <div key={entry.id} className="bg-canvas border border-line rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="text-ink font-semibold">{entry.serviceType}</p>
                            <p className="text-sm text-muted mt-1">Date: {formatDueDate(entry.serviceDate)}</p>
                            <p className="text-sm text-muted mt-1">Cost: {formatCurrencyPHP(entry.cost)}</p>
                          </div>
                          <p className="text-sm text-ink md:text-right">{entry.notes || "No notes"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-ink">Expenses Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-canvas border border-line rounded-xl p-4">
                    <p className="text-sm text-muted">Monthly Expenses</p>
                    <p className="text-xl font-semibold text-ink mt-1">{formatCurrencyPHP(expenseSummary.monthlyTotal)}</p>
                  </div>
                  <div className="bg-canvas border border-line rounded-xl p-4">
                    <p className="text-sm text-muted">Yearly Expenses</p>
                    <p className="text-xl font-semibold text-ink mt-1">{formatCurrencyPHP(expenseSummary.yearlyTotal)}</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="flex justify-stretch sm:justify-end">
            <button
              type="button"
              onClick={() => setHistoryVehicle(null)}
              className="w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accentHover text-onAccent rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      <LogMaintenanceModal
        isOpen={Boolean(vehicleToLogMaintenance)}
        onClose={() => setVehicleToLogMaintenance(null)}
        onSuccess={() => {
          setVehicleToLogMaintenance(null);
          router.refresh();
        }}
        title={vehicleToLogMaintenance ? `Log Maintenance: ${vehicleToLogMaintenance.year} ${vehicleToLogMaintenance.make} ${vehicleToLogMaintenance.model}` : "Log Maintenance"}
        vehicle={vehicleToLogMaintenance ? {
          id: vehicleToLogMaintenance.id,
          label: `${vehicleToLogMaintenance.year} ${vehicleToLogMaintenance.make} ${vehicleToLogMaintenance.model}`,
          currentMileage: vehicleToLogMaintenance.current_mileage,
        } : null}
      />

      <Dialog
        isOpen={Boolean(vehicleToDelete)}
        onClose={() => setVehicleToDelete(null)}
        title="Delete Vehicle"
      >
        <div className="space-y-4">
          <p className="text-muted text-sm">
            {vehicleToDelete
              ? `Delete ${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}? This also removes related maintenance, reminders, and expenses.`
              : "Delete this vehicle?"}
          </p>
          {/* Mobile adjustment: stack destructive confirmation actions for easier touch interaction */}
          <div className="flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setVehicleToDelete(null)}
              className="px-4 py-2 text-ink hover:bg-surfaceHover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-onAccent rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}


