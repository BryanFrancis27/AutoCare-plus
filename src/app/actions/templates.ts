"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Vehicle } from "@/types";
import {
  classifyVehicle,
  getMaintenanceTemplate,
  applyManufacturerAdjustments,
} from "@/lib/maintenance";
import { revalidatePath } from "next/cache";

/**
 * Template Server Actions
 * Get vehicle templates and generate initial reminders for new vehicles
 */

/**
 * Get maintenance template for a vehicle
 * Returns the complete maintenance schedule based on vehicle classification
 */
export async function getVehicleMaintenanceTemplate(vehicleId: string): Promise<{
  data: {
    vehicleType: string;
    powertrain: string;
    ageGroup: string;
    maintenanceItems: Array<{
      categoryId: string;
      categoryName: string;
      timeIntervalMonths: number;
      mileageIntervalKm?: number;
      priority: string;
      description: string;
    }>;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    // Get vehicle details
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (error || !vehicle) {
      console.error("Error fetching vehicle:", error);
      return { data: null, error: error?.message || "Vehicle not found" };
    }

    // Classify vehicle and get template
    const classification = classifyVehicle(vehicle.make, vehicle.model, vehicle.year);
    const template = getMaintenanceTemplate(
      classification.vehicleType,
      classification.powertrain,
      classification.ageGroup
    );

    // Apply manufacturer-specific adjustments
    const adjustedItems = applyManufacturerAdjustments(
      template.maintenanceItems,
      vehicle.make,
      vehicle.model
    );

    return {
      data: {
        vehicleType: template.vehicleType,
        powertrain: template.powertrain,
        ageGroup: template.ageGroup,
        maintenanceItems: adjustedItems,
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Generate initial maintenance reminders for a new vehicle
 * This should be called after a vehicle is created
 */
export async function generateInitialReminders(vehicleId: string): Promise<{
  success: boolean;
  remindersCreated: number;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, remindersCreated: 0, error: "Unauthorized" };
    }

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (vehicleError || !vehicle) {
      console.error("Error fetching vehicle:", vehicleError);
      return {
        success: false,
        remindersCreated: 0,
        error: vehicleError?.message || "Vehicle not found",
      };
    }

    // Get maintenance template
    const classification = classifyVehicle(vehicle.make, vehicle.model, vehicle.year);
    const template = getMaintenanceTemplate(
      classification.vehicleType,
      classification.powertrain,
      classification.ageGroup
    );

    // Apply manufacturer-specific adjustments
    const maintenanceItems = applyManufacturerAdjustments(
      template.maintenanceItems,
      vehicle.make,
      vehicle.model
    );

    // Generate reminders for each maintenance item
    const reminders = maintenanceItems.map((item) => {
      // Calculate initial due date (default to 30 days from now if time-based)
      const today = new Date();
      let dueDate: string | undefined;
      let dueMileage: number | undefined;

      if (item.timeIntervalMonths > 0) {
        const due = new Date(today);
        // For initial setup, set reminders 30 days out for immediate items (< 3 months)
        // Otherwise use half the interval as initial reminder
        if (item.timeIntervalMonths <= 3) {
          due.setDate(due.getDate() + 30);
        } else {
          due.setMonth(due.getMonth() + Math.floor(item.timeIntervalMonths / 2));
        }
        dueDate = due.toISOString().split("T")[0];
      }

      if (item.mileageIntervalKm && vehicle.current_mileage) {
        // Set reminder at 80% of the interval
        dueMileage =
          vehicle.current_mileage + Math.floor(item.mileageIntervalKm * 0.8);
      }

      return {
        user_id: user.id,
        vehicle_id: vehicleId,
        title: `${item.categoryName} Due`,
        reminder_type: item.categoryName,
        service_category: item.categoryId,
        description: item.description,
        due_date: dueDate,
        due_mileage: dueMileage,
        priority: item.priority,
        time_interval_months: item.timeIntervalMonths,
        mileage_interval_km: item.mileageIntervalKm,
        status: "upcoming",
        is_completed: false,
      };
    });

    // Insert all reminders
    const { data, error: insertError } = await supabase
      .from("reminders")
      .insert(reminders)
      .select();

    if (insertError) {
      console.error("Error creating reminders:", insertError);
      return {
        success: false,
        remindersCreated: 0,
        error: insertError.message,
      };
    }

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/reminders");
    revalidatePath("/dashboard");

    return {
      success: true,
      remindersCreated: data?.length || 0,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      remindersCreated: 0,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get recommended maintenance items based on vehicle age and mileage
 * This can be used for suggesting upcoming maintenance
 */
export async function getRecommendedMaintenance(vehicleId: string): Promise<{
  data: Array<{
    categoryId: string;
    categoryName: string;
    description: string;
    priority: string;
    reason: string;
  }> | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (vehicleError || !vehicle) {
      console.error("Error fetching vehicle:", vehicleError);
      return {
        data: null,
        error: vehicleError?.message || "Vehicle not found",
      };
    }

    // Get existing maintenance records
    const { data: maintenanceRecords } = await supabase
      .from("maintenance_logs")
      .select("service_category, service_date, mileage")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .order("service_date", { ascending: false });

    // Get maintenance template
    const classification = classifyVehicle(vehicle.make, vehicle.model, vehicle.year);
    const template = getMaintenanceTemplate(
      classification.vehicleType,
      classification.powertrain,
      classification.ageGroup
    );

    const maintenanceItems = applyManufacturerAdjustments(
      template.maintenanceItems,
      vehicle.make,
      vehicle.model
    );

    // Find items that haven't been serviced yet or are due soon
    const recommendations = maintenanceItems
      .filter((item) => {
        // Check if this service has been performed
        const lastService = maintenanceRecords?.find(
          (record) => record.service_category === item.categoryId
        );

        if (!lastService) {
          // Never performed - high priority recommendation
          return true;
        }

        // Check if due based on time or mileage
        const today = new Date();
        const lastServiceDate = new Date(lastService.service_date);
        const monthsSinceService =
          (today.getTime() - lastServiceDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30);

        const isTimeDue =
          item.timeIntervalMonths > 0 &&
          monthsSinceService >= item.timeIntervalMonths * 0.9;

        const isMileageDue =
          item.mileageIntervalKm &&
          vehicle.current_mileage &&
          lastService.mileage &&
          vehicle.current_mileage - lastService.mileage >=
            item.mileageIntervalKm * 0.9;

        return isTimeDue || isMileageDue;
      })
      .map((item) => {
        const lastService = maintenanceRecords?.find(
          (record) => record.service_category === item.categoryId
        );

        let reason = "Recommended for your vehicle type";
        if (!lastService) {
          reason = "No service history found - recommended to schedule";
        } else {
          reason = "Due based on time or mileage since last service";
        }

        return {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          description: item.description,
          priority: item.priority,
          reason,
        };
      });

    return { data: recommendations, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Refresh reminders for a vehicle based on latest maintenance records
 * Useful when maintenance records are updated
 */
export async function refreshVehicleReminders(vehicleId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete existing incomplete reminders
    await supabase
      .from("reminders")
      .delete()
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .eq("is_completed", false);

    // Generate new reminders
    const result = await generateInitialReminders(vehicleId);

    return { success: result.success, error: result.error };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
