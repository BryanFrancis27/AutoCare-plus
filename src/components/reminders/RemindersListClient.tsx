"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, Car, ChevronRight, GaugeCircle } from "lucide-react";
import { Button, Card, Dialog, LoadingState } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { completeReminderWithServiceLog, getReminderModalData, type ReminderModalData } from "@/app/actions/reminders";
import { calculateDaysUntilDue, formatDueDate, formatMileage, getPriorityColor } from "@/lib/maintenance";
import type { Reminder } from "@/types";

type VehicleListItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string | null;
  current_mileage: number | null;
  image_url?: string | null;
};

type RemindersListClientProps = {
  initialReminders: Reminder[];
  initialVehicles: VehicleListItem[];
  initialError: string | null;
};

type ReminderStatus = "overdue" | "upcoming" | "completed";

type VehicleReminderSummary = VehicleListItem & {
  displayName: string;
  reminders: Reminder[];
  overdue: Reminder[];
  upcoming: Reminder[];
  completed: Reminder[];
};

type ReminderCardProps = {
  reminder: Reminder;
  borderClassName: string;
  dueContent?: string;
  onView?: (reminderId: string) => void;
  completed?: boolean;
};

type VehicleCatalogCardProps = {
  vehicle: VehicleReminderSummary;
  onOpen: (vehicleId: string) => void;
};

type ReminderSectionProps = {
  title: string;
  reminders: Reminder[];
  status: ReminderStatus;
  onView: (reminderId: string) => void;
  emptyMessage: string;
};

type ReminderDetailsDialogProps = {
  activeReminderId: string | null;
  modalData: ReminderModalData | null;
  isModalLoading: boolean;
  modalError: string | null;
  isCompleting: boolean;
  onClose: () => void;
  onMarkDone: () => void;
};

function getVehicleDisplayName(vehicle: VehicleListItem): string {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ").trim();
}

function getReminderStatus(reminder: Reminder): ReminderStatus {
  if (reminder.isCompleted || reminder.status === "completed") {
    return "completed";
  }

  if (reminder.status === "overdue") {
    return "overdue";
  }

  if (reminder.dueDate) {
    const dueDate = new Date(reminder.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!Number.isNaN(dueDate.getTime()) && dueDate < today) {
      return "overdue";
    }
  }

  return "upcoming";
}

function getReminderVehicleLabel(reminder: Reminder): string {
  return reminder.vehicleName || "Vehicle unavailable";
}

function VehicleCatalogCard({ vehicle, onOpen }: VehicleCatalogCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(vehicle.id)}
      className="card group w-full overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:border-redPrimary/60 hover:shadow-[0_0_24px_rgba(211,47,47,0.14)] focus:outline-none focus:ring-2 focus:ring-redPrimary/70"
    >
      <div className="relative h-44 w-full border-b border-grayBorder bg-darkBg">
        {vehicle.image_url ? (
          <Image
            src={vehicle.image_url}
            alt={vehicle.displayName}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(211,47,47,0.18),transparent_62%)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-grayBorder bg-containerBg text-redPrimary">
              <Car className="h-8 w-8" />
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 inline-flex rounded-full border border-redPrimary/30 bg-black/70 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-redPrimary backdrop-blur-sm">
          {vehicle.reminders.length} {vehicle.reminders.length === 1 ? "REMINDER" : "REMINDERS"}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-semibold text-whitePure break-words">{vehicle.displayName}</h3>
          <p className="text-sm text-textSecondary">Model: {vehicle.model}</p>
          <p className="text-sm text-textSecondary">
            {vehicle.plate_number || "Plate number not added"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-grayBorder bg-darkBg px-3 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">Overdue</p>
            <p className="mt-2 text-2xl font-semibold text-redPrimary">{vehicle.overdue.length}</p>
          </div>
          <div className="rounded-xl border border-grayBorder bg-darkBg px-3 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">Upcoming</p>
            <p className="mt-2 text-2xl font-semibold text-blue-600">{vehicle.upcoming.length}</p>
          </div>
          <div className="rounded-xl border border-grayBorder bg-darkBg px-3 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">{vehicle.completed.length}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-grayBorder bg-darkBg px-4 py-3 text-sm text-textSecondary">
          <span>
            {vehicle.current_mileage != null ? formatMileage(vehicle.current_mileage) : "Mileage not set"}
          </span>
          <span className="inline-flex items-center gap-2 font-medium text-whitePure">
            View reminders
            <ChevronRight className="h-4 w-4 text-redPrimary transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </button>
  );
}

function ReminderCardItem({
  reminder,
  borderClassName,
  dueContent,
  onView,
  completed = false,
}: ReminderCardProps) {
  return (
    <Card className={`p-4 ${borderClassName} ${completed ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-semibold text-textPrimary ${completed ? "line-through" : ""}`}>
              {reminder.title || reminder.reminderType}
            </h3>
            {completed ? (
              <span className="rounded-full border border-grayBorder bg-darkBg px-2.5 py-1 text-xs font-medium text-textSecondary">
                COMPLETED
              </span>
            ) : (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(reminder.priority)}`}>
                {reminder.priority.toUpperCase()}
              </span>
            )}
          </div>

          <div className="mt-2">
            <span className="inline-flex rounded-full border border-grayBorder bg-darkBg px-2.5 py-1 text-xs font-medium text-textSecondary">
              Vehicle: {getReminderVehicleLabel(reminder)}
            </span>
          </div>

          <p className="mt-2 text-sm text-textSecondary">{reminder.description}</p>

          {(dueContent || reminder.dueMileage) && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-textSecondary">
              {dueContent && <span>{dueContent}</span>}
              {reminder.dueMileage && <span>Due at: {formatMileage(reminder.dueMileage)}</span>}
            </div>
          )}
        </div>

        {onView && !completed && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onView(reminder.id)}>
              View
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function ReminderSection({ title, reminders, status, onView, emptyMessage }: ReminderSectionProps) {
  const isCompleted = status === "completed";
  const borderClassName = status === "overdue" ? "border-l-4 border-redPrimary" : "border-l-4 border-grayBorder";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
        <span className="rounded-full border border-grayBorder bg-darkBg px-3 py-1 text-xs font-medium tracking-[0.12em] text-textSecondary">
          {reminders.length}
        </span>
      </div>

      {reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const daysUntil = reminder.dueDate ? calculateDaysUntilDue(reminder.dueDate) : null;
            const dueContent = reminder.dueDate
              ? status === "overdue"
                ? `Due: ${formatDueDate(reminder.dueDate)} (${Math.abs(daysUntil ?? 0)} days overdue)`
                : `Due: ${formatDueDate(reminder.dueDate)}${daysUntil !== null ? ` (in ${daysUntil} days)` : ""}`
              : undefined;

            return (
              <ReminderCardItem
                key={reminder.id}
                reminder={reminder}
                borderClassName={borderClassName}
                dueContent={dueContent}
                onView={isCompleted ? undefined : onView}
                completed={isCompleted}
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed p-4 text-sm text-textSecondary">{emptyMessage}</Card>
      )}
    </section>
  );
}

function ReminderDetailsDialog({
  activeReminderId,
  modalData,
  isModalLoading,
  modalError,
  isCompleting,
  onClose,
  onMarkDone,
}: ReminderDetailsDialogProps) {
  return (
    <Dialog
      isOpen={Boolean(activeReminderId)}
      onClose={onClose}
      title={modalData?.reminder.title || modalData?.reminder.reminderType || "Reminder Details"}
      size="full"
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        {isModalLoading && (
          <LoadingState mode="container" label="Loading reminder details..." className="min-h-[240px]" />
        )}

        {modalError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {modalError}
          </div>
        )}

        {modalData && !isModalLoading && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="min-h-[280px] overflow-hidden rounded-xl border border-grayBorder bg-darkBg">
              {modalData.vehicle?.imageUrl ? (
                <div className="relative h-full min-h-[280px] w-full">
                  <Image
                    src={modalData.vehicle.imageUrl}
                    alt={modalData.vehicle.displayName}
                    fill
                    unoptimized
                    className="object-contain p-6"
                  />
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center bg-darkBg p-6">
                  <div className="flex h-full max-h-[420px] w-full items-center justify-center rounded-xl border border-dashed border-grayBorder bg-containerBg/60">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-redPrimary/15 text-redPrimary">
                        <Car className="h-10 w-10" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-whitePure">No vehicle image available</p>
                        <p className="text-sm text-textSecondary">A placeholder is shown until a vehicle photo is added.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>

              <div className="grid min-h-0 gap-4">
                <div className="rounded-xl border border-grayBorder bg-darkBg p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-redPrimary" />
                  <h3 className="text-base font-semibold text-whitePure">Maintenance Information</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-grayBorder bg-containerBg p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Maintenance type</p>
                    <p className="mt-2 text-base font-medium text-whitePure">{modalData.reminder.reminderType}</p>
                  </div>
                  <div className="rounded-lg border border-grayBorder bg-containerBg p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Scheduled date</p>
                    <p className="mt-2 text-base font-medium text-whitePure">
                      {modalData.reminder.dueDate ? formatDueDate(modalData.reminder.dueDate) : "Not scheduled"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-grayBorder bg-containerBg p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Description</p>
                    <p className="mt-2 text-sm leading-6 text-textSecondary">
                      {modalData.reminder.description || "No description available for this reminder."}
                    </p>
                  </div>
                </div>
                </div>

                <div className="rounded-xl border border-grayBorder bg-darkBg p-5">
                <div className="mb-4 flex items-center gap-2">
                  <GaugeCircle className="h-4 w-4 text-redPrimary" />
                  <h3 className="text-base font-semibold text-whitePure">Vehicle Information</h3>
                </div>

                {modalData.vehicle ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-grayBorder bg-containerBg p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Vehicle name</p>
                      <p className="mt-2 text-base font-medium text-whitePure">{modalData.vehicle.displayName}</p>
                    </div>
                    <div className="rounded-lg border border-grayBorder bg-containerBg p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Vehicle model</p>
                      <p className="mt-2 text-base font-medium text-whitePure">
                        {modalData.vehicle.make} {modalData.vehicle.model}
                      </p>
                    </div>
                    <div className="rounded-lg border border-grayBorder bg-containerBg p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Mileage</p>
                      <p className="mt-2 text-base font-medium text-whitePure">
                        {modalData.vehicle.currentMileage != null ? formatMileage(modalData.vehicle.currentMileage) : "Not set"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-grayBorder bg-containerBg p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Last service date</p>
                      <p className="mt-2 text-base font-medium text-whitePure">
                        {modalData.vehicle.lastServiceDate ? formatDueDate(modalData.vehicle.lastServiceDate) : "No service records"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-grayBorder bg-containerBg p-4">
                    <p className="text-sm text-textSecondary">Vehicle information is not available for this reminder.</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile adjustment: stack dialog actions for better tap ergonomics */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-2 border-t border-grayBorder pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg px-4 py-2 text-white transition-colors hover:bg-[#3A3A3A]"
          >
            Close
          </button>
          {modalData && !modalData.reminder.isCompleted && (
            <button
              type="button"
              onClick={onMarkDone}
              disabled={isCompleting}
              className="w-full sm:w-auto rounded-lg bg-[#D32F2F] px-4 py-2 text-white transition-colors hover:bg-[#B71C1C] disabled:opacity-50"
            >
              {isCompleting ? "Updating..." : "Mark as DONE"}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function RemindersListClient({ initialReminders, initialVehicles, initialError }: RemindersListClientProps) {
  const router = useRouter();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ReminderModalData | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const reminderCounts = useMemo(() => {
    return initialReminders.reduce(
      (counts, reminder) => {
        const status = getReminderStatus(reminder);
        counts[status] += 1;
        return counts;
      },
      { overdue: 0, upcoming: 0, completed: 0 }
    );
  }, [initialReminders]);

  const vehicleSummaries = useMemo<VehicleReminderSummary[]>(() => {
    const remindersByVehicle = initialReminders.reduce<Record<string, Reminder[]>>((accumulator, reminder) => {
      if (!accumulator[reminder.vehicleId]) {
        accumulator[reminder.vehicleId] = [];
      }

      accumulator[reminder.vehicleId].push(reminder);
      return accumulator;
    }, {});

    return initialVehicles.map((vehicle) => {
      const reminders = remindersByVehicle[vehicle.id] ?? [];
      const overdue: Reminder[] = [];
      const upcoming: Reminder[] = [];
      const completed: Reminder[] = [];

      reminders.forEach((reminder) => {
        const status = getReminderStatus(reminder);

        if (status === "completed") {
          completed.push(reminder);
          return;
        }

        if (status === "overdue") {
          overdue.push(reminder);
          return;
        }

        upcoming.push(reminder);
      });

      return {
        ...vehicle,
        displayName: getVehicleDisplayName(vehicle),
        reminders,
        overdue,
        upcoming,
        completed,
      };
    });
  }, [initialReminders, initialVehicles]);

  const selectedVehicle = useMemo(
    () => vehicleSummaries.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicleSummaries]
  );

  const openReminderModal = async (reminderId: string) => {
    setActiveReminderId(reminderId);
    setModalData(null);
    setModalError(null);
    setIsModalLoading(true);

    const result = await getReminderModalData(reminderId);
    setIsModalLoading(false);

    if (result.error) {
      setModalError(result.error);
      return;
    }

    setModalData(result.data);
  };

  const closeReminderModal = () => {
    setActiveReminderId(null);
    setModalData(null);
    setModalError(null);
  };

  const closeVehicleModal = () => {
    setSelectedVehicleId(null);
    closeReminderModal();
  };

  const handleMarkDone = async () => {
    if (!activeReminderId) return;

    setIsCompleting(true);
    setModalError(null);

    const result = await completeReminderWithServiceLog(activeReminderId);
    setIsCompleting(false);

    if (result.error) {
      setModalError(result.error);
      return;
    }

    closeReminderModal();
    router.refresh();
  };

  if (initialError) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-4">
        <PageHeader title="Reminders" description="Review reminders by vehicle." />
        <Card className="p-6">
          <p className="text-red-600">Error loading reminders: {initialError}</p>
        </Card>
      </main>
    );
  }

  return (
    <>
      {/* Mobile adjustment: compact horizontal padding for phone widths */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <PageHeader
          title="Service Reminders"
          description="Select a vehicle to review overdue, upcoming, and completed service reminders."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm font-medium text-textSecondary">Registered Vehicles</div>
            <div className="text-3xl font-bold text-whitePure">{initialVehicles.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-textSecondary">Active Reminders</div>
            <div className="text-3xl font-bold text-whitePure">{reminderCounts.overdue + reminderCounts.upcoming}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-textSecondary">Overdue Services</div>
            <div className="text-3xl font-bold text-redPrimary">{reminderCounts.overdue}</div>
          </Card>
        </div>

        {initialVehicles.length === 0 && (
          <Card className="p-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-textPrimary">No Vehicles Yet</h3>
            <p className="text-textSecondary mb-6">
              Add a vehicle first to organize reminders by vehicle.
            </p>
            <Button href="/vehicles">View Vehicles</Button>
          </Card>
        )}

        {initialVehicles.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-textPrimary">Vehicle Catalog</h2>
                <p className="text-sm text-textSecondary">
                  Open a vehicle card to view all related reminders in one place.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-grayBorder bg-darkBg px-3 py-1 text-xs font-medium tracking-[0.14em] text-textSecondary">
                <Bell className="h-3.5 w-3.5 text-redPrimary" />
                {initialReminders.length} total reminders
              </div>
            </div>

            {/* Mobile adjustment: keep a single-column catalog on phones and move to two columns on tablets+ */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {vehicleSummaries.map((vehicle) => (
                <VehicleCatalogCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onOpen={setSelectedVehicleId}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Dialog
        isOpen={Boolean(selectedVehicle)}
        onClose={closeVehicleModal}
        title={selectedVehicle?.displayName || "Vehicle reminders"}
        size="full"
      >
        {selectedVehicle && (
          <div className="flex h-full min-h-0 flex-col gap-6">
            {/* Mobile adjustment: modal content stacks vertically before switching to split layout on desktop */}
            <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl border border-grayBorder bg-darkBg">
                {selectedVehicle.image_url ? (
                  <div className="relative h-full min-h-[240px] w-full">
                    <Image
                      src={selectedVehicle.image_url}
                      alt={selectedVehicle.displayName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[240px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(211,47,47,0.18),transparent_62%)] p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-grayBorder bg-containerBg text-redPrimary">
                      <Car className="h-10 w-10" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Vehicle Overview</p>
                      <h3 className="mt-2 text-2xl font-semibold text-whitePure">{selectedVehicle.displayName}</h3>
                      <p className="mt-2 text-sm text-textSecondary">
                        {selectedVehicle.plate_number || "Plate number not added"}
                      </p>
                      <p className="mt-1 text-sm text-textSecondary">
                        {selectedVehicle.current_mileage != null ? formatMileage(selectedVehicle.current_mileage) : "Mileage not set"}
                      </p>
                    </div>
                    <div className="rounded-full border border-redPrimary/30 bg-redPrimary/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-redPrimary">
                      {selectedVehicle.reminders.length} TOTAL
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-4">
                    <div className="text-sm font-medium text-textSecondary">Overdue Services</div>
                    <div className="mt-2 text-3xl font-bold text-redPrimary">{selectedVehicle.overdue.length}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm font-medium text-textSecondary">Upcoming Services</div>
                    <div className="mt-2 text-3xl font-bold text-blue-600">{selectedVehicle.upcoming.length}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm font-medium text-textSecondary">Completed Services</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">{selectedVehicle.completed.length}</div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-6">
                <ReminderSection
                  title="Overdue Services"
                  reminders={selectedVehicle.overdue}
                  status="overdue"
                  onView={openReminderModal}
                  emptyMessage="No overdue reminders for this vehicle."
                />
                <ReminderSection
                  title="Upcoming Services"
                  reminders={selectedVehicle.upcoming}
                  status="upcoming"
                  onView={openReminderModal}
                  emptyMessage="No upcoming reminders for this vehicle."
                />
                <ReminderSection
                  title="Completed Services"
                  reminders={selectedVehicle.completed}
                  status="completed"
                  onView={openReminderModal}
                  emptyMessage="No completed reminders for this vehicle yet."
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <ReminderDetailsDialog
        activeReminderId={activeReminderId}
        modalData={modalData}
        isModalLoading={isModalLoading}
        modalError={modalError}
        isCompleting={isCompleting}
        onClose={closeReminderModal}
        onMarkDone={handleMarkDone}
      />
    </>
  );
}

