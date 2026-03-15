// Common type definitions for AutoCare+

// ⚠️ NOTE: Database table names differ from TypeScript interface names:
// - MaintenanceRecord interface → maintenance_logs table
// - Reminder interface → reminders table (has additional 'title' and 'status' fields)
// - Vehicle interface → vehicles table

// Enums and Type Unions
export type VehicleType = 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'van' | 'hybrid' | 'ev';
export type Powertrain = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type MaintenancePriority = 'high' | 'medium' | 'low';
export type VehicleAgeGroup = 'new' | 'mid-life' | 'aging'; // 0-3, 4-7, 8+ years

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vehicleType: VehicleType;
  powertrain: Powertrain;
  currentMileage?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  userId: string; // Maps to user_id in database
  vehicleId: string;
  serviceType: string;
  serviceCategory: string;
  serviceDate: string;
  mileage: number;
  cost: number;
  notes?: string;
  receiptUrl?: string; // Maps to receipt_url in database
  nextDueDate?: string;
  nextDueMileage?: number;
  priority: MaintenancePriority;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string; // Maps to user_id in database
  vehicleId: string;
  vehicleName?: string;
  title?: string; // Existing field in database
  reminderType: string;
  serviceCategory: string;
  description: string;
  dueDate?: string;
  dueMileage?: number;
  priority: MaintenancePriority;
  timeIntervalMonths?: number;
  mileageIntervalKm?: number;
  status?: 'upcoming' | 'overdue' | 'completed'; // Existing field in database
  isCompleted: boolean;
  notes?: string; // Existing field in database
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  maintenanceId?: string;
  vehicleId: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// Maintenance System Types
export interface MaintenanceCategory {
  id: string;
  name: string;
  description: string;
  defaultTimeIntervalMonths: number;
  defaultMileageIntervalKm?: number;
  priority: MaintenancePriority;
  applicableVehicleTypes?: VehicleType[];
  applicablePowertrains?: Powertrain[];
}

export interface MaintenanceTemplate {
  vehicleType: VehicleType;
  powertrain: Powertrain;
  ageGroup: VehicleAgeGroup;
  maintenanceItems: MaintenanceTemplateItem[];
}

export interface MaintenanceTemplateItem {
  categoryId: string;
  categoryName: string;
  timeIntervalMonths: number;
  mileageIntervalKm?: number;
  priority: MaintenancePriority;
  description: string;
}

export interface DrivingConditions {
  heavyCityTraffic: boolean;
  longHighwayDriving: boolean;
  roughRoads: boolean;
  hotClimate: boolean;
}

export interface VehicleClassification {
  vehicleType: VehicleType;
  ageGroup: VehicleAgeGroup;
  powertrain: Powertrain;
}
