/**
 * AutoCare+ Maintenance System
 * Central export for all maintenance-related utilities and data
 */

// Types
export type {
  MaintenanceCategory,
  MaintenanceTemplate,
  MaintenanceTemplateItem,
  DrivingConditions,
  VehicleClassification,
  MaintenancePriority,
  VehicleType,
  Powertrain,
  VehicleAgeGroup,
} from "@/types";

// Static Data
export {
  MAINTENANCE_CATEGORIES,
  getMaintenanceCategoryById,
  getMaintenanceCategoryByName,
  getApplicableCategories,
  getCategoriesByPriority,
} from "./maintenanceCategories";

// Templates
export {
  getMaintenanceTemplate,
  getMaintenanceItems,
  applyManufacturerAdjustments,
} from "./maintenanceTemplates";

// Vehicle Classification
export {
  classifyVehicle,
  classifyVehicleType,
  classifyPowertrain,
  getVehicleAgeGroup,
  getClassificationDescription,
  VEHICLE_TYPE_OPTIONS,
  POWERTRAIN_OPTIONS,
} from "./vehicleClassifier";

// Reminder Calculations
export type { MaintenanceInterval, NextDueCalculation } from "./reminderCalculations";
export {
  calculateNextDueDate,
  calculateNextDueMileage,
  calculateDaysUntilDue,
  calculateKmUntilDue,
  isMaintenanceOverdue,
  isMaintenanceUpcoming,
  calculateNextDue,
  applyDrivingConditionModifiers,
  getPriorityColor,
  getPriorityLabel,
  formatDueDate,
  formatMileage,
  getReminderStatusMessage,
} from "./reminderCalculations";
