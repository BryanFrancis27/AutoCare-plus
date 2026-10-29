"use client";

import { useMemo, useState, useTransition } from "react";
import { Car, Plus, SearchX, AlertCircle } from "lucide-react";
import { AddVehicleModal } from "@/components/vehicles/AddVehicleModal";
import { LogMaintenanceModal } from "@/components/maintenance/LogMaintenanceModal";
import { Dialog, LoadingState } from "@/components/ui";
import { useRouter } from "next/navigation";
import { formatCurrencyPHP } from "@/lib/currency";
import { formatDueDate } from "@/lib/maintenance";
import { classificationLabel, formatRecordedMileage, garageTypeOptions, hasReliableTimestamps, selectGarageVehicles, type GarageSort, type GarageVehicle } from "@/lib/vehicles/garage-model";
import { useVehicleGarage } from "@/lib/vehicles/use-vehicle-garage";
import { GarageToolbar } from "./GarageToolbar";
import { GarageVehicleCard } from "./GarageVehicleCard";
import { VehicleImage } from "./VehicleImage";

type VehiclesListClientProps = { vehicles: GarageVehicle[]; error?: string | null };

export function VehiclesListClient({ vehicles, error }: VehiclesListClientProps) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  const garage = useVehicleGarage(vehicles);
  const {
    localVehicles, isAddModalOpen, setIsAddModalOpen, vehicleToView, setVehicleToView,
    vehicleToEdit, setVehicleToEdit, vehicleToDelete, beginDelete, closeDelete,
    vehicleToLogMaintenance, setVehicleToLogMaintenance, historyVehicle, historyEntries,
    isHistoryLoading, historyError, isDeleting, actionError, feedback, expenseSummary,
    upsertLocalVehicle, handleDeleteVehicle, openServiceHistory, closeServiceHistory, maintenanceSaved,
  } = garage;
  const [query, setQuery] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [sort, setSort] = useState<GarageSort>("name-asc");
  const types = useMemo(() => {
    const options = garageTypeOptions(localVehicles);
    if (vehicleType !== "all" && !options.some(option => option.value === vehicleType)) options.push({ value: vehicleType, label: vehicleType === "unspecified" ? "Not specified" : classificationLabel(vehicleType) });
    return options;
  }, [localVehicles, vehicleType]);
  const canSortRecent = hasReliableTimestamps(localVehicles);
  const effectiveSort = sort === "recent" && !canSortRecent ? "name-asc" : sort;
  const visibleVehicles = useMemo(() => selectGarageVehicles(localVehicles, query, vehicleType, effectiveSort), [localVehicles, query, vehicleType, effectiveSort]);
  const resetFilters = () => { setQuery(""); setVehicleType("all"); setSort("name-asc"); };

  return (
    <>
      <div className="application-workspace space-y-6 py-6 sm:py-8">
        <div className="workspace-header flex flex-col justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Your vehicles, together</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">My Garage</h1>
            <p className="mt-2 max-w-prose text-base text-muted">Keep your vehicle details and service history in one place.</p>
          </div>
          <button type="button" onClick={() => setIsAddModalOpen(true)} className="button-primary min-h-11 shrink-0 gap-2"><Plus className="h-5 w-5" aria-hidden="true" />Add Vehicle</button>
        </div>
        {feedback && <p role="status" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink">{feedback}</p>}
        {error ? <section role="alert" aria-busy={retrying} className="card flex items-start gap-3 p-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div><h2 className="font-semibold text-ink">We couldn&apos;t load your vehicles</h2><p className="mt-1 text-sm text-muted">{error}</p><button type="button" onClick={() => startRetry(() => router.refresh())} disabled={retrying} className="button-secondary mt-4 min-h-11">{retrying ? "Reloading..." : "Try again"}</button></div>
        </section> : localVehicles.length === 0 ? <section className="card px-6 py-10 text-center">
          <Car className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink">Your garage starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Add your first vehicle to keep its details, maintenance history and service costs together.</p>
          <p className="mt-4 text-sm text-muted">Choose Add Vehicle above to get started.</p>
        </section> : <>
          <GarageToolbar query={query} vehicleType={vehicleType} sort={effectiveSort} types={types} canSortRecent={canSortRecent} matchingCount={visibleVehicles.length} total={localVehicles.length} onQuery={setQuery} onType={setVehicleType} onSort={setSort} onReset={resetFilters} />
          {visibleVehicles.length ? <div className="garage-vehicle-grid">
            {visibleVehicles.map(vehicle => <GarageVehicleCard key={vehicle.id} vehicle={vehicle} featured={visibleVehicles.length === 1} onView={setVehicleToView} onEdit={setVehicleToEdit} onDelete={beginDelete} onLogMaintenance={setVehicleToLogMaintenance} onServiceHistory={openServiceHistory} />)}
          </div> : <section className="card px-6 py-8 text-center">
            <SearchX className="mx-auto h-8 w-8 text-muted" aria-hidden="true" /><h2 className="mt-3 break-words text-lg font-semibold text-ink">No vehicles match your search</h2><p className="mt-2 text-sm text-muted">Try a different make, model, year or plate, or reset your filters.</p><button type="button" onClick={resetFilters} className="button-secondary mt-4 min-h-11">Reset Filters</button>
          </section>}
        </>}
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
              <VehicleImage src={vehicleToView.image_url} name={`${vehicleToView.year} ${vehicleToView.make} ${vehicleToView.model}`} compact />
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-ink">
                  {vehicleToView.year} {vehicleToView.make} {vehicleToView.model}
                </h3>
                <p className="break-words text-sm text-muted">{vehicleToView.plate_number || "License plate not recorded"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Mileage</p>
                <p className="break-words text-ink font-medium">{formatRecordedMileage(vehicleToView.current_mileage)}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Vehicle Type</p>
                <p className="break-words text-ink font-medium capitalize">{vehicleToView.vehicle_type || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Powertrain</p>
                <p className="break-words text-ink font-medium capitalize">{vehicleToView.powertrain || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Transmission</p>
                <p className="break-words text-ink font-medium">{vehicleToView.transmission || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Color</p>
                <p className="break-words text-ink font-medium">{vehicleToView.color || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Purchase Date</p>
                <p className="break-words text-ink font-medium">{vehicleToView.purchase_date || "Not set"}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-muted">Purchase Price</p>
                <p className="break-words text-ink font-medium">
                  {vehicleToView.purchase_price != null ? formatCurrencyPHP(vehicleToView.purchase_price) : "Not set"}
                </p>
              </div>
            </div>

            <div className="bg-canvas rounded-lg p-3">
              <p className="text-muted text-sm">Notes</p>
              <p className="text-ink text-sm mt-1 whitespace-pre-wrap break-words">{vehicleToView.notes || "No notes"}</p>
            </div>

            <div className="flex justify-stretch sm:justify-end">
              <button
                type="button"
                onClick={() => setVehicleToView(null)}
                className="min-h-11 w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accentHover text-onAccent rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={Boolean(historyVehicle)}
        onClose={closeServiceHistory}
        title={historyVehicle ? `${historyVehicle.year} ${historyVehicle.make} ${historyVehicle.model} Service & Expenses` : "Service & Expenses"}
        size="full"
      >
        <div className="h-full space-y-4 overflow-y-auto">
          {isHistoryLoading && (
            <LoadingState mode="container" label="Loading service history..." className="min-h-[220px]" />
          )}

          {historyError && (
            <div role="alert" className="border border-accent/30 bg-accentSoft text-accent rounded-xl p-4 text-sm">
              {historyError}
              {historyVehicle && <button type="button" onClick={() => openServiceHistory(historyVehicle)} className="button-secondary mt-3 min-h-11">Try again</button>}
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
                            <p className="break-words text-ink font-semibold">{entry.serviceType}</p>
                            <p className="text-sm text-muted mt-1">Date: {formatDueDate(entry.serviceDate)}</p>
                            <p className="text-sm text-muted mt-1">Cost: {formatCurrencyPHP(entry.cost)}</p>
                          </div>
                          <p className="min-w-0 break-words text-sm text-ink md:text-right">{entry.notes || "No notes"}</p>
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
              onClick={closeServiceHistory}
              className="min-h-11 w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accentHover text-onAccent rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      <LogMaintenanceModal
        isOpen={Boolean(vehicleToLogMaintenance)}
        onClose={() => setVehicleToLogMaintenance(null)}
        onSuccess={maintenanceSaved}
        title={vehicleToLogMaintenance ? `Log Maintenance: ${vehicleToLogMaintenance.year} ${vehicleToLogMaintenance.make} ${vehicleToLogMaintenance.model}` : "Log Maintenance"}
        vehicle={vehicleToLogMaintenance ? {
          id: vehicleToLogMaintenance.id,
          label: `${vehicleToLogMaintenance.year} ${vehicleToLogMaintenance.make} ${vehicleToLogMaintenance.model}`,
          currentMileage: vehicleToLogMaintenance.current_mileage,
        } : null}
      />

      <Dialog
        isOpen={Boolean(vehicleToDelete)}
        onClose={closeDelete}
        title="Delete Vehicle"
      >
        <div className="space-y-4" aria-busy={isDeleting}>
          {actionError && <p role="alert" className="rounded-lg border border-accent/30 bg-accentSoft p-3 text-sm text-accent">{actionError}</p>}
          <p className="text-muted text-sm">
            {vehicleToDelete
              ? `Delete ${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}? This also removes related maintenance, reminders, and expenses.`
              : "Delete this vehicle?"}
          </p>
          {/* Mobile adjustment: stack destructive confirmation actions for easier touch interaction */}
          <div className="flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-2">
            <button
              type="button"
              onClick={closeDelete}
              disabled={isDeleting}
              className="min-h-11 px-4 py-2 text-ink hover:bg-surfaceHover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              disabled={isDeleting}
              className="min-h-11 w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accentHover text-onAccent rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}


