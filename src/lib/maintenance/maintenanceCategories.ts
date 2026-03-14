import { MaintenanceCategory, MaintenancePriority } from "@/types";

/**
 * Static maintenance categories based on AutoCare+ maintenance data strategy
 * These are widely accepted automotive maintenance best practices
 * 
 * ⚠️ IMPORTANT: These are general guidance only, not manufacturer-specific recommendations
 */

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  {
    id: "oil-change",
    name: "Engine Oil & Filter Change",
    description: "Replace engine oil and oil filter to maintain engine lubrication and performance",
    defaultTimeIntervalMonths: 6,
    defaultMileageIntervalKm: 7500, // Average between 5,000-10,000 km
    priority: "high",
  },
  {
    id: "tire-rotation",
    name: "Tire Rotation",
    description: "Rotate tires to ensure even wear and extend tire life",
    defaultTimeIntervalMonths: 0, // Mileage-based only
    defaultMileageIntervalKm: 10000,
    priority: "medium",
  },
  {
    id: "brake-inspection",
    name: "Brake Inspection",
    description: "Inspect brake pads, rotors, and brake fluid for safety",
    defaultTimeIntervalMonths: 12,
    priority: "high",
  },
  {
    id: "battery-check",
    name: "Battery Check",
    description: "Test battery health and check connections",
    defaultTimeIntervalMonths: 12,
    priority: "medium",
  },
  {
    id: "air-filter",
    name: "Air Filter Replacement",
    description: "Replace engine air filter to maintain air flow and fuel efficiency",
    defaultTimeIntervalMonths: 12,
    defaultMileageIntervalKm: 20000,
    priority: "medium",
  },
  {
    id: "cabin-filter",
    name: "Cabin Air Filter Replacement",
    description: "Replace cabin air filter for cleaner air inside the vehicle",
    defaultTimeIntervalMonths: 12,
    defaultMileageIntervalKm: 15000,
    priority: "low",
  },
  {
    id: "fluid-check",
    name: "Fluid Level Check",
    description: "Check and top up all fluid levels (coolant, brake, transmission, power steering)",
    defaultTimeIntervalMonths: 0, // Check during other services
    defaultMileageIntervalKm: 5000,
    priority: "high",
  },
  {
    id: "general-inspection",
    name: "General Safety Inspection",
    description: "Comprehensive inspection of lights, wipers, belts, hoses, and suspension",
    defaultTimeIntervalMonths: 12,
    priority: "high",
  },
  {
    id: "coolant-flush",
    name: "Coolant System Flush",
    description: "Flush and replace engine coolant",
    defaultTimeIntervalMonths: 24,
    defaultMileageIntervalKm: 40000,
    priority: "medium",
  },
  {
    id: "transmission-fluid",
    name: "Transmission Fluid Service",
    description: "Check and replace transmission fluid if needed",
    defaultTimeIntervalMonths: 0, // Varies by vehicle
    defaultMileageIntervalKm: 50000,
    priority: "high",
    applicableVehicleTypes: ["sedan", "hatchback", "suv", "pickup", "van"],
    applicablePowertrains: ["gasoline", "diesel", "hybrid"],
  },
  {
    id: "spark-plugs",
    name: "Spark Plug Replacement",
    description: "Replace spark plugs for optimal engine performance",
    defaultTimeIntervalMonths: 0,
    defaultMileageIntervalKm: 80000,
    priority: "medium",
    applicablePowertrains: ["gasoline", "hybrid"],
  },
  {
    id: "wheel-alignment",
    name: "Wheel Alignment",
    description: "Adjust wheel angles for proper tire wear and handling",
    defaultTimeIntervalMonths: 0,
    defaultMileageIntervalKm: 20000,
    priority: "medium",
  },
  {
    id: "suspension-inspection",
    name: "Suspension Inspection",
    description: "Inspect shocks, struts, and suspension components",
    defaultTimeIntervalMonths: 12,
    defaultMileageIntervalKm: 20000,
    priority: "medium",
    applicableVehicleTypes: ["suv", "pickup"],
  },
  {
    id: "differential-fluid",
    name: "Differential Fluid Service",
    description: "Replace differential fluid for AWD/4WD vehicles",
    defaultTimeIntervalMonths: 0,
    defaultMileageIntervalKm: 50000,
    priority: "medium",
    applicableVehicleTypes: ["suv", "pickup"],
  },
  {
    id: "timing-belt",
    name: "Timing Belt Replacement",
    description: "Replace timing belt (if applicable) to prevent engine damage",
    defaultTimeIntervalMonths: 0,
    defaultMileageIntervalKm: 100000,
    priority: "high",
    applicablePowertrains: ["gasoline", "diesel"],
  },
  {
    id: "fuel-system",
    name: "Fuel System Cleaning",
    description: "Clean fuel injectors and fuel system",
    defaultTimeIntervalMonths: 0,
    defaultMileageIntervalKm: 40000,
    priority: "low",
    applicablePowertrains: ["gasoline", "diesel"],
  },
  {
    id: "exhaust-inspection",
    name: "Exhaust System Inspection",
    description: "Inspect exhaust system for leaks and damage",
    defaultTimeIntervalMonths: 12,
    priority: "medium",
    applicablePowertrains: ["gasoline", "diesel", "hybrid"],
  },
  // Electric Vehicle Specific
  {
    id: "ev-battery-check",
    name: "EV Battery Health Check",
    description: "Inspect high-voltage battery system and cooling",
    defaultTimeIntervalMonths: 12,
    priority: "high",
    applicableVehicleTypes: ["ev", "hybrid"],
    applicablePowertrains: ["electric", "hybrid"],
  },
  {
    id: "ev-brake-inspection",
    name: "EV Brake System Inspection",
    description: "Inspect brakes (regenerative braking may affect wear patterns)",
    defaultTimeIntervalMonths: 0,
    defaultMileageIntervalKm: 20000,
    priority: "high",
    applicableVehicleTypes: ["ev"],
    applicablePowertrains: ["electric"],
  },
  {
    id: "ev-software-update",
    name: "Software Update Check",
    description: "Check for available software and firmware updates",
    defaultTimeIntervalMonths: 12,
    priority: "medium",
    applicableVehicleTypes: ["ev", "hybrid"],
    applicablePowertrains: ["electric", "hybrid"],
  },
];

/**
 * Get maintenance category by ID
 */
export function getMaintenanceCategoryById(id: string): MaintenanceCategory | undefined {
  return MAINTENANCE_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get maintenance category by name (case-insensitive)
 */
export function getMaintenanceCategoryByName(name: string): MaintenanceCategory | undefined {
  return MAINTENANCE_CATEGORIES.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all maintenance categories applicable to a specific vehicle type and powertrain
 */
export function getApplicableCategories(
  vehicleType: string,
  powertrain: string
): MaintenanceCategory[] {
  return MAINTENANCE_CATEGORIES.filter((cat) => {
    const vehicleTypeMatch =
      !cat.applicableVehicleTypes ||
      cat.applicableVehicleTypes.includes(vehicleType as any);
    const powertrainMatch =
      !cat.applicablePowertrains ||
      cat.applicablePowertrains.includes(powertrain as any);
    return vehicleTypeMatch && powertrainMatch;
  });
}

/**
 * Get categories by priority level
 */
export function getCategoriesByPriority(priority: MaintenancePriority): MaintenanceCategory[] {
  return MAINTENANCE_CATEGORIES.filter((cat) => cat.priority === priority);
}
