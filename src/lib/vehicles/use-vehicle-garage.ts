'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteVehicle } from '@/app/actions/vehicles';
import { getVehicleServiceHistory, type ServiceHistoryEntry } from '@/app/actions/maintenance';
import { normalizeGarageVehicle, summarizeGarageExpenses, type GarageVehicle, type VehicleInput } from './garage-model';

export function useVehicleGarage(vehicles: GarageVehicle[]) {
  const router = useRouter();
  const [localVehicles, setLocalVehicles] = useState(vehicles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicleToView, setVehicleToView] = useState<GarageVehicle | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<GarageVehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<GarageVehicle | null>(null);
  const [vehicleToLogMaintenance, setVehicleToLogMaintenance] = useState<GarageVehicle | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<GarageVehicle | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ServiceHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const mounted = useRef(true);
  const historyRequest = useRef(0);
  const deleting = useRef(false);

  useEffect(() => { setLocalVehicles(vehicles); }, [vehicles]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; historyRequest.current += 1; };
  }, []);
  const expenseSummary = useMemo(() => summarizeGarageExpenses(historyEntries), [historyEntries]);

  function upsertLocalVehicle(vehicle: VehicleInput) {
    setLocalVehicles(previous => {
      const existing = previous.find(item => item.id === vehicle.id);
      const normalized = normalizeGarageVehicle({ ...existing, ...vehicle });
      return existing ? previous.map(item => item.id === vehicle.id ? normalized : item) : [normalized, ...previous];
    });
    setFeedback('Vehicle saved to your garage.');
  }
  function beginDelete(vehicle: GarageVehicle) {
    setActionError(null);
    setFeedback('');
    setVehicleToDelete(vehicle);
  }
  function closeDelete() { if (!deleting.current) setVehicleToDelete(null); }
  async function handleDeleteVehicle() {
    if (!vehicleToDelete || deleting.current) return;
    const target = vehicleToDelete;
    deleting.current = true;
    setIsDeleting(true);
    setActionError(null);
    try {
      const result = await deleteVehicle(target.id);
      if (!mounted.current) return;
      if (result.error || !result.data) {
        setActionError(result.error || 'Deletion could not be confirmed. Please refresh your garage before trying again.');
        return;
      }
      setLocalVehicles(previous => previous.filter(vehicle => vehicle.id !== target.id));
      setVehicleToDelete(null);
      setFeedback('Vehicle removed from your garage.');
      router.refresh();
    } catch {
      if (mounted.current) setActionError('Could not delete this vehicle. Please try again.');
    } finally {
      deleting.current = false;
      if (mounted.current) setIsDeleting(false);
    }
  }
  function closeServiceHistory() {
    historyRequest.current += 1;
    setHistoryVehicle(null);
  }
  async function openServiceHistory(vehicle: GarageVehicle) {
    const request = ++historyRequest.current;
    setHistoryVehicle(vehicle);
    setHistoryEntries([]);
    setHistoryError(null);
    setIsHistoryLoading(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        getVehicleServiceHistory(vehicle.id),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Service history took too long to load. Please try again.')), 20000); }),
      ]);
      if (!mounted.current || request !== historyRequest.current) return;
      if (result.error || result.data === null) throw new Error(result.error || 'Could not load service history.');
      setHistoryEntries(result.data);
    } catch (error) {
      if (mounted.current && request === historyRequest.current) setHistoryError(error instanceof Error ? error.message : 'Could not load service history. Please try again.');
    } finally {
      clearTimeout(timer);
      if (mounted.current && request === historyRequest.current) setIsHistoryLoading(false);
    }
  }
  function maintenanceSaved() {
    setVehicleToLogMaintenance(null);
    setFeedback('Maintenance record saved.');
    router.refresh();
  }
  return {
    localVehicles, isAddModalOpen, setIsAddModalOpen, vehicleToView, setVehicleToView,
    vehicleToEdit, setVehicleToEdit, vehicleToDelete, beginDelete, closeDelete,
    vehicleToLogMaintenance, setVehicleToLogMaintenance, historyVehicle, historyEntries,
    isHistoryLoading, historyError, isDeleting, actionError, feedback, expenseSummary,
    upsertLocalVehicle, handleDeleteVehicle, openServiceHistory, closeServiceHistory, maintenanceSaved,
  };
}
