"use client";

import { useState } from 'react';
import Link from "next/link";
import { Car, Plus, Calendar, Wrench } from 'lucide-react';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';

const vehicles = [
  {
    id: 1,
    name: '2021 Honda Civic',
    plate: 'ABC-123',
    mileage: '35,420',
    nextService: 'Oil Change - Jan 15',
    status: 'Good',
  },
  {
    id: 2,
    name: '2019 Toyota Camry',
    plate: 'XYZ-789',
    mileage: '52,890',
    nextService: 'Tire Rotation - Jan 20',
    status: 'Attention',
  },
];

export default function VehiclesListPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page Header */}
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

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-[#262626] border border-[#3A3A3A] rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#D32F2F] flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{vehicle.name}</h3>
                  <p className="text-sm text-[#B0B0B0]">{vehicle.plate}</p>
                </div>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  vehicle.status === 'Good'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {vehicle.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#B0B0B0]">Mileage</span>
                <span className="text-white font-medium">{vehicle.mileage} miles</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#1D1D1C] rounded-lg">
                <Calendar className="w-4 h-4 text-[#D32F2F]" />
                <span className="text-sm text-white">{vehicle.nextService}</span>
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
    </div>

    {/* Add Vehicle Modal */}
    <AddVehicleModal 
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
    />
  </>
  );
}
