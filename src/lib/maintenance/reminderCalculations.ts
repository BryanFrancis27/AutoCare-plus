import { DrivingConditions, MaintenancePriority } from "@/types";

/**
 * Reminder Calculation Utilities
 * Functions to calculate next maintenance due dates and apply driving condition modifiers
 * 
 * Based on AutoCare+ maintenance data strategy:
 * - next_due_date = last_service_date + interval
 * - Both time-based and mileage-based triggers supported
 * - Driving conditions can modify intervals
 */

export interface MaintenanceInterval {
  timeIntervalMonths: number;
  mileageIntervalKm?: number;
}

export interface NextDueCalculation {
  nextDueDate?: string;
  nextDueMileage?: number;
  daysUntilDue?: number;
  kmUntilDue?: number;
  isOverdue: boolean;
  isUpcoming: boolean; // Due within 30 days
}

/**
 * Calculate next due date based on last service date and time interval
 */
export function calculateNextDueDate(
  lastServiceDate: string,
  intervalMonths: number
): string {
  const lastDate = new Date(lastServiceDate);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  return nextDate.toISOString().split("T")[0];
}

/**
 * Calculate next due mileage based on current/last mileage and mileage interval
 */
export function calculateNextDueMileage(
  currentMileage: number,
  intervalKm: number
): number {
  return currentMileage + intervalKm;
}

/**
 * Calculate days until maintenance is due
 */
export function calculateDaysUntilDue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate kilometers until maintenance is due
 */
export function calculateKmUntilDue(
  currentMileage: number,
  dueMileage: number
): number {
  return dueMileage - currentMileage;
}

/**
 * Check if maintenance is overdue based on date or mileage
 */
export function isMaintenanceOverdue(
  dueDate?: string,
  dueMileage?: number,
  currentMileage?: number
): boolean {
  const today = new Date();

  // Check time-based overdue
  if (dueDate) {
    const due = new Date(dueDate);
    if (today > due) return true;
  }

  // Check mileage-based overdue
  if (dueMileage !== undefined && currentMileage !== undefined) {
    if (currentMileage >= dueMileage) return true;
  }

  return false;
}

/**
 * Check if maintenance is upcoming (within 30 days or 500 km)
 */
export function isMaintenanceUpcoming(
  dueDate?: string,
  dueMileage?: number,
  currentMileage?: number
): boolean {
  if (dueDate) {
    const daysUntil = calculateDaysUntilDue(dueDate);
    if (daysUntil >= 0 && daysUntil <= 30) return true;
  }

  if (dueMileage !== undefined && currentMileage !== undefined) {
    const kmUntil = calculateKmUntilDue(currentMileage, dueMileage);
    if (kmUntil >= 0 && kmUntil <= 500) return true;
  }

  return false;
}

/**
 * Calculate complete next due information
 */
export function calculateNextDue(
  lastServiceDate: string,
  lastServiceMileage: number,
  interval: MaintenanceInterval,
  currentMileage?: number
): NextDueCalculation {
  let nextDueDate: string | undefined;
  let nextDueMileage: number | undefined;
  let daysUntilDue: number | undefined;
  let kmUntilDue: number | undefined;

  // Calculate time-based due date
  if (interval.timeIntervalMonths > 0) {
    nextDueDate = calculateNextDueDate(lastServiceDate, interval.timeIntervalMonths);
    daysUntilDue = calculateDaysUntilDue(nextDueDate);
  }

  // Calculate mileage-based due mileage
  if (interval.mileageIntervalKm) {
    nextDueMileage = calculateNextDueMileage(
      lastServiceMileage,
      interval.mileageIntervalKm
    );
    if (currentMileage !== undefined) {
      kmUntilDue = calculateKmUntilDue(currentMileage, nextDueMileage);
    }
  }

  const isOverdue = isMaintenanceOverdue(nextDueDate, nextDueMileage, currentMileage);
  const isUpcoming = isMaintenanceUpcoming(nextDueDate, nextDueMileage, currentMileage);

  return {
    nextDueDate,
    nextDueMileage,
    daysUntilDue,
    kmUntilDue,
    isOverdue,
    isUpcoming,
  };
}

/**
 * Apply driving condition modifiers to maintenance intervals
 * Based on the maintenance data strategy:
 * - Heavy city traffic: -20% on oil change interval
 * - Long highway driving: +10% on oil change interval
 * - Rough roads: More frequent suspension checks
 * - Hot climate: More frequent cooling checks
 */
export function applyDrivingConditionModifiers(
  interval: MaintenanceInterval,
  conditions: DrivingConditions,
  categoryId: string
): MaintenanceInterval {
  let modifiedInterval = { ...interval };

  // Oil change adjustments
  if (categoryId === "oil-change") {
    if (conditions.heavyCityTraffic) {
      // Shorten interval by 20%
      modifiedInterval.timeIntervalMonths = Math.max(
        3,
        Math.floor(interval.timeIntervalMonths * 0.8)
      );
      if (interval.mileageIntervalKm) {
        modifiedInterval.mileageIntervalKm = Math.floor(interval.mileageIntervalKm * 0.8);
      }
    } else if (conditions.longHighwayDriving) {
      // Slightly extend interval by 10%
      modifiedInterval.timeIntervalMonths = Math.ceil(interval.timeIntervalMonths * 1.1);
      if (interval.mileageIntervalKm) {
        modifiedInterval.mileageIntervalKm = Math.ceil(interval.mileageIntervalKm * 1.1);
      }
    }
  }

  // Suspension checks for rough roads
  if (categoryId === "suspension-inspection" && conditions.roughRoads) {
    modifiedInterval.timeIntervalMonths = Math.max(
      6,
      Math.floor(interval.timeIntervalMonths * 0.75)
    );
    if (interval.mileageIntervalKm) {
      modifiedInterval.mileageIntervalKm = Math.floor(interval.mileageIntervalKm * 0.75);
    }
  }

  // Cooling system checks for hot climate
  if (
    (categoryId === "coolant-flush" || categoryId === "fluid-check") &&
    conditions.hotClimate
  ) {
    modifiedInterval.timeIntervalMonths = Math.max(
      6,
      Math.floor(interval.timeIntervalMonths * 0.85)
    );
  }

  // Brake inspections for city traffic
  if (categoryId === "brake-inspection" && conditions.heavyCityTraffic) {
    modifiedInterval.timeIntervalMonths = Math.max(
      6,
      Math.floor(interval.timeIntervalMonths * 0.9)
    );
    if (interval.mileageIntervalKm) {
      modifiedInterval.mileageIntervalKm = Math.floor(interval.mileageIntervalKm * 0.9);
    }
  }

  return modifiedInterval;
}

/**
 * Get priority color class for UI
 */
export function getPriorityColor(priority: MaintenancePriority): string {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-yellow-600 bg-yellow-50";
    case "low":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: MaintenancePriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Format due date for display
 */
export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format mileage for display
 */
export function formatMileage(mileage: number): string {
  return mileage.toLocaleString("en-US") + " km";
}

/**
 * Get status message for reminder
 */
export function getReminderStatusMessage(
  daysUntilDue?: number,
  kmUntilDue?: number,
  isOverdue?: boolean
): string {
  if (isOverdue) {
    if (daysUntilDue !== undefined && daysUntilDue < 0) {
      return `Overdue by ${Math.abs(daysUntilDue)} days`;
    }
    if (kmUntilDue !== undefined && kmUntilDue < 0) {
      return `Overdue by ${Math.abs(kmUntilDue)} km`;
    }
    return "Overdue";
  }

  if (daysUntilDue !== undefined && daysUntilDue >= 0) {
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    if (daysUntilDue <= 30) return `Due in ${daysUntilDue} days`;
    return `Due in ${Math.ceil(daysUntilDue / 30)} months`;
  }

  if (kmUntilDue !== undefined && kmUntilDue >= 0) {
    return `Due in ${formatMileage(kmUntilDue)}`;
  }

  return "Status unknown";
}
