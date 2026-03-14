import {
  MaintenanceTemplate,
  MaintenanceTemplateItem,
  VehicleType,
  Powertrain,
  VehicleAgeGroup,
} from "@/types";

/**
 * Static maintenance templates based on vehicle type, powertrain, and age
 * These templates define default maintenance schedules for different vehicle configurations
 * 
 * ⚠️ IMPORTANT: These are general guidance based on industry best practices,
 * not manufacturer-specific or OEM-certified schedules
 */

// Base template items that apply to most vehicles
const BASE_MAINTENANCE_ITEMS: MaintenanceTemplateItem[] = [
  {
    categoryId: "oil-change",
    categoryName: "Engine Oil & Filter Change",
    timeIntervalMonths: 6,
    mileageIntervalKm: 7500,
    priority: "high",
    description: "Regular oil changes maintain engine health",
  },
  {
    categoryId: "tire-rotation",
    categoryName: "Tire Rotation",
    timeIntervalMonths: 0,
    mileageIntervalKm: 10000,
    priority: "medium",
    description: "Rotate tires for even wear",
  },
  {
    categoryId: "brake-inspection",
    categoryName: "Brake Inspection",
    timeIntervalMonths: 12,
    priority: "high",
    description: "Annual brake system safety check",
  },
  {
    categoryId: "battery-check",
    categoryName: "Battery Check",
    timeIntervalMonths: 12,
    priority: "medium",
    description: "Test battery health annually",
  },
  {
    categoryId: "air-filter",
    categoryName: "Air Filter Replacement",
    timeIntervalMonths: 12,
    mileageIntervalKm: 20000,
    priority: "medium",
    description: "Replace air filter for optimal performance",
  },
  {
    categoryId: "cabin-filter",
    categoryName: "Cabin Air Filter Replacement",
    timeIntervalMonths: 12,
    mileageIntervalKm: 15000,
    priority: "low",
    description: "Replace cabin filter for air quality",
  },
  {
    categoryId: "fluid-check",
    categoryName: "Fluid Level Check",
    timeIntervalMonths: 0,
    mileageIntervalKm: 5000,
    priority: "high",
    description: "Check all fluid levels regularly",
  },
  {
    categoryId: "general-inspection",
    categoryName: "General Safety Inspection",
    timeIntervalMonths: 12,
    priority: "high",
    description: "Comprehensive annual safety inspection",
  },
];

// Gasoline vehicle specific items
const GASOLINE_ITEMS: MaintenanceTemplateItem[] = [
  {
    categoryId: "spark-plugs",
    categoryName: "Spark Plug Replacement",
    timeIntervalMonths: 0,
    mileageIntervalKm: 80000,
    priority: "medium",
    description: "Replace spark plugs for optimal ignition",
  },
  {
    categoryId: "fuel-system",
    categoryName: "Fuel System Cleaning",
    timeIntervalMonths: 0,
    mileageIntervalKm: 40000,
    priority: "low",
    description: "Clean fuel system components",
  },
  {
    categoryId: "exhaust-inspection",
    categoryName: "Exhaust System Inspection",
    timeIntervalMonths: 12,
    priority: "medium",
    description: "Inspect exhaust for leaks",
  },
];

// Heavy vehicle specific items (SUV, Pickup)
const HEAVY_VEHICLE_ITEMS: MaintenanceTemplateItem[] = [
  {
    categoryId: "suspension-inspection",
    categoryName: "Suspension Inspection",
    timeIntervalMonths: 12,
    mileageIntervalKm: 20000,
    priority: "medium",
    description: "Inspect suspension components for heavy use",
  },
  {
    categoryId: "differential-fluid",
    categoryName: "Differential Fluid Service",
    timeIntervalMonths: 0,
    mileageIntervalKm: 50000,
    priority: "medium",
    description: "Service differential for AWD/4WD systems",
  },
];

// Electric vehicle specific items
const EV_ITEMS: MaintenanceTemplateItem[] = [
  {
    categoryId: "ev-battery-check",
    categoryName: "EV Battery Health Check",
    timeIntervalMonths: 12,
    priority: "high",
    description: "Inspect high-voltage battery system",
  },
  {
    categoryId: "ev-brake-inspection",
    categoryName: "EV Brake System Inspection",
    timeIntervalMonths: 0,
    mileageIntervalKm: 20000,
    priority: "high",
    description: "Inspect brakes (regenerative braking affects wear)",
  },
  {
    categoryId: "ev-software-update",
    categoryName: "Software Update Check",
    timeIntervalMonths: 12,
    priority: "medium",
    description: "Check for system software updates",
  },
  {
    categoryId: "coolant-flush",
    categoryName: "Battery Cooling System Check",
    timeIntervalMonths: 24,
    mileageIntervalKm: 40000,
    priority: "medium",
    description: "Check battery cooling system",
  },
];

// Hybrid vehicle items (combination)
const HYBRID_ITEMS: MaintenanceTemplateItem[] = [
  {
    categoryId: "ev-battery-check",
    categoryName: "Hybrid Battery Health Check",
    timeIntervalMonths: 12,
    priority: "high",
    description: "Check hybrid battery system",
  },
  {
    categoryId: "brake-inspection",
    categoryName: "Brake Inspection (Hybrid)",
    timeIntervalMonths: 0,
    mileageIntervalKm: 30000,
    priority: "high",
    description: "Inspect brakes considering regenerative system",
  },
  {
    categoryId: "spark-plugs",
    categoryName: "Spark Plug Replacement",
    timeIntervalMonths: 0,
    mileageIntervalKm: 80000,
    priority: "medium",
    description: "Replace spark plugs",
  },
];

/**
 * Generate maintenance template for a vehicle
 */
export function getMaintenanceTemplate(
  vehicleType: VehicleType,
  powertrain: Powertrain,
  ageGroup: VehicleAgeGroup
): MaintenanceTemplate {
  let items = [...BASE_MAINTENANCE_ITEMS];

  // Add powertrain-specific items
  if (powertrain === "gasoline" || powertrain === "diesel") {
    items = [...items, ...GASOLINE_ITEMS];
    
    // Add transmission fluid for non-EV
    items.push({
      categoryId: "transmission-fluid",
      categoryName: "Transmission Fluid Service",
      timeIntervalMonths: 0,
      mileageIntervalKm: 50000,
      priority: "high",
      description: "Check and replace transmission fluid",
    });
  } else if (powertrain === "electric") {
    // Remove oil change for pure EVs
    items = items.filter((item) => item.categoryId !== "oil-change");
    items = [...items, ...EV_ITEMS];
  } else if (powertrain === "hybrid") {
    items = [...items, ...HYBRID_ITEMS];
  }

  // Add vehicle type specific items
  if (vehicleType === "suv" || vehicleType === "pickup") {
    items = [...items, ...HEAVY_VEHICLE_ITEMS];
  }

  // Adjust intervals based on age group
  items = items.map((item) => {
    if (ageGroup === "aging") {
      // More frequent inspections for older vehicles
      return {
        ...item,
        timeIntervalMonths: item.timeIntervalMonths
          ? Math.max(6, Math.floor(item.timeIntervalMonths * 0.8))
          : 0,
        mileageIntervalKm: item.mileageIntervalKm
          ? Math.floor(item.mileageIntervalKm * 0.9)
          : undefined,
      };
    } else if (ageGroup === "new") {
      // Slightly extended intervals for new vehicles (still following manufacturer guidance)
      return {
        ...item,
        timeIntervalMonths: item.timeIntervalMonths
          ? Math.ceil(item.timeIntervalMonths * 1.1)
          : 0,
        mileageIntervalKm: item.mileageIntervalKm
          ? Math.ceil(item.mileageIntervalKm * 1.05)
          : undefined,
      };
    }
    return item;
  });

  return {
    vehicleType,
    powertrain,
    ageGroup,
    maintenanceItems: items,
  };
}

/**
 * Get all maintenance items for a vehicle configuration
 */
export function getMaintenanceItems(
  vehicleType: VehicleType,
  powertrain: Powertrain,
  ageGroup: VehicleAgeGroup
): MaintenanceTemplateItem[] {
  const template = getMaintenanceTemplate(vehicleType, powertrain, ageGroup);
  return template.maintenanceItems;
}

/**
 * Manufacturer-specific adjustments (non-OEM, for realism)
 * These are light adjustments based on common knowledge, not official schedules
 */
export function applyManufacturerAdjustments(
  items: MaintenanceTemplateItem[],
  make: string,
  model: string
): MaintenanceTemplateItem[] {
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  return items.map((item) => {
    // Toyota CVT vehicles - more frequent transmission checks
    if (
      makeLower === "toyota" &&
      (modelLower.includes("corolla") || modelLower.includes("camry")) &&
      item.categoryId === "transmission-fluid"
    ) {
      return { ...item, mileageIntervalKm: 60000 };
    }

    // Honda CVT vehicles
    if (
      makeLower === "honda" &&
      (modelLower.includes("civic") || modelLower.includes("cr-v")) &&
      item.categoryId === "transmission-fluid"
    ) {
      return { ...item, mileageIntervalKm: 50000 };
    }

    // Ford trucks - more frequent differential service
    if (
      makeLower === "ford" &&
      (modelLower.includes("ranger") || modelLower.includes("everest")) &&
      item.categoryId === "differential-fluid"
    ) {
      return { ...item, mileageIntervalKm: 40000 };
    }

    return item;
  });
}
