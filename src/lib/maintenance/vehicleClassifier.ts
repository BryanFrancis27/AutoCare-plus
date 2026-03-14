import { VehicleType, Powertrain, VehicleAgeGroup, VehicleClassification } from "@/types";

/**
 * Vehicle Classification Utility
 * Determines vehicle type, age group, and powertrain based on make, model, and year
 * 
 * ⚠️ This is a simplified classifier for general guidance
 * Real-world implementation might use a vehicle database API
 */

/**
 * Calculate vehicle age group based on year
 */
export function getVehicleAgeGroup(year: number): VehicleAgeGroup {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 3) return "new";
  if (age <= 7) return "mid-life";
  return "aging";
}

/**
 * Classify vehicle type based on make and model
 * This is a simplified heuristic-based approach
 */
export function classifyVehicleType(make: string, model: string): VehicleType {
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  // Electric vehicles
  if (
    modelLower.includes("tesla") ||
    modelLower.includes("leaf") ||
    modelLower.includes("bolt") ||
    modelLower.includes("id.") ||
    modelLower.includes("e-tron") ||
    modelLower.includes("ionic") ||
    modelLower.includes("kona electric") ||
    modelLower.includes("niro ev") ||
    modelLower.includes("mach-e") ||
    modelLower.includes("ev6") ||
    modelLower.includes("model")
  ) {
    return "ev";
  }

  // Pickup trucks
  if (
    modelLower.includes("ranger") ||
    modelLower.includes("hilux") ||
    modelLower.includes("tacoma") ||
    modelLower.includes("tundra") ||
    modelLower.includes("f-150") ||
    modelLower.includes("f-250") ||
    modelLower.includes("silverado") ||
    modelLower.includes("colorado") ||
    modelLower.includes("navara") ||
    modelLower.includes("frontier") ||
    modelLower.includes("ridgeline")
  ) {
    return "pickup";
  }

  // SUVs
  if (
    modelLower.includes("rav4") ||
    modelLower.includes("cr-v") ||
    modelLower.includes("highlander") ||
    modelLower.includes("pilot") ||
    modelLower.includes("explorer") ||
    modelLower.includes("everest") ||
    modelLower.includes("fortuner") ||
    modelLower.includes("tahoe") ||
    modelLower.includes("suburban") ||
    modelLower.includes("expedition") ||
    modelLower.includes("escape") ||
    modelLower.includes("ecosport") ||
    modelLower.includes("territory") ||
    modelLower.includes("cx-") ||
    modelLower.includes("outlander") ||
    modelLower.includes("santa fe") ||
    modelLower.includes("tucson") ||
    modelLower.includes("sorento") ||
    modelLower.includes("sportage") ||
    modelLower.includes("x-trail") ||
    modelLower.includes("rogue") ||
    modelLower.includes("pathfinder")
  ) {
    return "suv";
  }

  // Vans
  if (
    modelLower.includes("odyssey") ||
    modelLower.includes("sienna") ||
    modelLower.includes("carnival") ||
    modelLower.includes("caravan") ||
    modelLower.includes("transit") ||
    modelLower.includes("hiace") ||
    modelLower.includes("pacifica")
  ) {
    return "van";
  }

  // Hatchbacks
  if (
    modelLower.includes("civic hatchback") ||
    modelLower.includes("jazz") ||
    modelLower.includes("fit") ||
    modelLower.includes("yaris") ||
    modelLower.includes("corolla hatchback") ||
    modelLower.includes("golf") ||
    modelLower.includes("fiesta") ||
    modelLower.includes("focus hatchback") ||
    modelLower.includes("rio") ||
    modelLower.includes("accent hatchback") ||
    modelLower.includes("mazda2") ||
    modelLower.includes("mazda3 hatchback") ||
    modelLower.includes("swift")
  ) {
    return "hatchback";
  }

  // Default to sedan for most cars
  return "sedan";
}

/**
 * Determine powertrain based on make, model, and year
 */
export function classifyPowertrain(make: string, model: string, year: number): Powertrain {
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  // Pure Electric
  if (
    makeLower === "tesla" ||
    modelLower.includes("leaf") ||
    modelLower.includes("bolt ev") ||
    modelLower.includes("id.") ||
    modelLower.includes("e-tron") ||
    modelLower.includes("ionic electric") ||
    modelLower.includes("kona electric") ||
    modelLower.includes("niro ev") ||
    modelLower.includes("mach-e") ||
    modelLower.includes("ev6")
  ) {
    return "electric";
  }

  // Hybrid
  if (
    modelLower.includes("prius") ||
    modelLower.includes("hybrid") ||
    modelLower.includes("camry hybrid") ||
    modelLower.includes("corolla hybrid") ||
    modelLower.includes("rav4 hybrid") ||
    modelLower.includes("highlander hybrid") ||
    modelLower.includes("accord hybrid") ||
    modelLower.includes("cr-v hybrid") ||
    modelLower.includes("insight") ||
    modelLower.includes("escape hybrid") ||
    modelLower.includes("fusion hybrid") ||
    modelLower.includes("niro hybrid") ||
    modelLower.includes("ioniq hybrid")
  ) {
    return "hybrid";
  }

  // Diesel (common in trucks and some SUVs, especially older models)
  if (
    (modelLower.includes("hilux") ||
      modelLower.includes("ranger") ||
      modelLower.includes("everest") ||
      modelLower.includes("fortuner")) &&
    year < 2023
  ) {
    // Many Asian market trucks/SUVs have diesel options
    // This is a simplified check - real implementation would need trim level data
    return "diesel";
  }

  // Default to gasoline
  return "gasoline";
}

/**
 * Perform complete vehicle classification
 */
export function classifyVehicle(
  make: string,
  model: string,
  year: number
): VehicleClassification {
  return {
    vehicleType: classifyVehicleType(make, model),
    powertrain: classifyPowertrain(make, model, year),
    ageGroup: getVehicleAgeGroup(year),
  };
}

/**
 * Get human-readable description of vehicle classification
 */
export function getClassificationDescription(classification: VehicleClassification): string {
  const typeLabels: Record<VehicleType, string> = {
    sedan: "Sedan",
    hatchback: "Hatchback",
    suv: "SUV",
    pickup: "Pickup Truck",
    van: "Van",
    hybrid: "Hybrid Vehicle",
    ev: "Electric Vehicle",
  };

  const powertrainLabels: Record<Powertrain, string> = {
    gasoline: "Gasoline",
    diesel: "Diesel",
    hybrid: "Hybrid",
    electric: "Electric",
  };

  const ageLabels: Record<VehicleAgeGroup, string> = {
    new: "New (0-3 years)",
    "mid-life": "Mid-life (4-7 years)",
    aging: "Aging (8+ years)",
  };

  return `${typeLabels[classification.vehicleType]} | ${
    powertrainLabels[classification.powertrain]
  } | ${ageLabels[classification.ageGroup]}`;
}

/**
 * Vehicle type options for manual selection
 */
export const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup Truck" },
  { value: "van", label: "Van" },
  { value: "hybrid", label: "Hybrid Vehicle" },
  { value: "ev", label: "Electric Vehicle (EV)" },
];

/**
 * Powertrain options for manual selection
 */
export const POWERTRAIN_OPTIONS: { value: Powertrain; label: string }[] = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];
