"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Car, Plus, Calendar, Wrench, Pencil, Trash2, Eye } from "lucide-react";
import { AddVehicleModal } from "@/components/vehicles/AddVehicleModal";
import { Dialog } from "@/components/ui";
import { deleteVehicle } from "@/app/actions/vehicles";
import { useRouter } from "next/navigation";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLocalVehicles(vehicles);
  }, [vehicles]);

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

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Vehicles</h1>
            <p className="text-[#B0B0B0]">Manage your vehicle fleet and track maintenance.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {actionError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4">
            {actionError}
          </div>
        )}

        {!error && localVehicles.length === 0 && (
          <div className="bg-[#262626] border border-[#3A3A3A] rounded-xl p-8 text-center">
            <Car className="w-10 h-10 text-[#B0B0B0] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white">No vehicles yet</h2>
            <p className="text-[#B0B0B0] mt-1">Add your first vehicle to start tracking maintenance.</p>
          </div>
        )}

        {!error && localVehicles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {localVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-[#262626] border border-[#3A3A3A] rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {vehicle.image_url ? (
                      <Image
                        src={vehicle.image_url}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-12 h-12 rounded-lg object-cover border border-[#3A3A3A]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#D32F2F] flex items-center justify-center">
                        <Car className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-[#B0B0B0]">{vehicle.plate_number || "No plate"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setVehicleToView(vehicle);
                      }}
                      className="p-2 bg-[#1D1D1C] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors border border-[#3A3A3A]"
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
                      className="p-2 bg-[#1D1D1C] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors border border-[#3A3A3A]"
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
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors border border-red-500/30"
                      aria-label="Delete vehicle"
                      title="Delete vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#B0B0B0]">Mileage</span>
                    <span className="text-white font-medium">
                      {vehicle.current_mileage?.toLocaleString() ?? "N/A"} miles
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-[#1D1D1C] rounded-lg">
                    <Calendar className="w-4 h-4 text-[#D32F2F]" />
                    <span className="text-sm text-white">Add service records to generate reminders</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/vehicles/${vehicle.id}/maintenance`}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1D1D1C] hover:bg-[#D32F2F] text-white px-4 py-2 rounded-lg transition-colors border border-[#3A3A3A]"
                  >
                    <Wrench className="w-4 h-4" />
                    Service History
                  </Link>
                  <Link
                    href={`/vehicles/${vehicle.id}/reminders/add`}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </Link>
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
            <div className="flex items-center gap-3">
              {vehicleToView.image_url ? (
                <Image
                  src={vehicleToView.image_url}
                  alt={`${vehicleToView.year} ${vehicleToView.make} ${vehicleToView.model}`}
                  width={72}
                  height={72}
                  unoptimized
                  className="w-[72px] h-[72px] rounded-lg object-cover border border-[#3A3A3A]"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-lg bg-[#D32F2F] flex items-center justify-center">
                  <Car className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {vehicleToView.year} {vehicleToView.make} {vehicleToView.model}
                </h3>
                <p className="text-sm text-[#B0B0B0]">{vehicleToView.plate_number || "No plate"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Mileage</p>
                <p className="text-white font-medium">{vehicleToView.current_mileage?.toLocaleString() ?? "N/A"} miles</p>
              </div>
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Vehicle Type</p>
                <p className="text-white font-medium capitalize">{vehicleToView.vehicle_type || "Not set"}</p>
              </div>
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Powertrain</p>
                <p className="text-white font-medium capitalize">{vehicleToView.powertrain || "Not set"}</p>
              </div>
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Transmission</p>
                <p className="text-white font-medium">{vehicleToView.transmission || "Not set"}</p>
              </div>
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Color</p>
                <p className="text-white font-medium">{vehicleToView.color || "Not set"}</p>
              </div>
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Purchase Date</p>
                <p className="text-white font-medium">{vehicleToView.purchase_date || "Not set"}</p>
              </div>
              <div className="bg-[#1D1D1C] rounded-lg p-3">
                <p className="text-[#B0B0B0]">Purchase Price</p>
                <p className="text-white font-medium">
                  {vehicleToView.purchase_price != null ? `$${vehicleToView.purchase_price.toLocaleString()}` : "Not set"}
                </p>
              </div>
            </div>

            <div className="bg-[#1D1D1C] rounded-lg p-3">
              <p className="text-[#B0B0B0] text-sm">Notes</p>
              <p className="text-white text-sm mt-1 whitespace-pre-wrap">{vehicleToView.notes || "No notes"}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setVehicleToView(null)}
                className="px-4 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={Boolean(vehicleToDelete)}
        onClose={() => setVehicleToDelete(null)}
        title="Delete Vehicle"
      >
        <div className="space-y-4">
          <p className="text-[#B0B0B0] text-sm">
            {vehicleToDelete
              ? `Delete ${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}? This also removes related maintenance, reminders, and expenses.`
              : "Delete this vehicle?"}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setVehicleToDelete(null)}
              className="px-4 py-2 text-white hover:bg-[#3A3A3A] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
