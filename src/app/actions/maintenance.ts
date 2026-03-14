"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MaintenanceRecord } from "@/types";
import { calculateNextDue, getMaintenanceCategoryById } from "@/lib/maintenance";
import { revalidatePath } from "next/cache";

/**
 * Maintenance Server Actions
 * CRUD operations for maintenance records with automatic reminder generation
 */

export interface CreateMaintenanceInput {
  vehicleId: string;
  serviceType: string;
  serviceCategory: string;
  serviceDate: string;
  mileage: number;
  cost: number;
  notes?: string;
  receiptUrl?: string;
}

export interface UpdateMaintenanceInput extends CreateMaintenanceInput {
  id: string;
}

/**
 * Get all maintenance records for a vehicle
 */
export async function getMaintenanceRecords(
  vehicleId: string
): Promise<{ data: MaintenanceRecord[] | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .order("service_date", { ascending: false });

    if (error) {
      console.error("Error fetching maintenance records:", error);
      return { data: null, error: error.message };
    }

    // Transform database records to match TypeScript interface
    const records: MaintenanceRecord[] = data.map((record) => ({
      id: record.id,
      userId: record.user_id,
      vehicleId: record.vehicle_id,
      serviceType: record.service_type,
      serviceCategory: record.service_category,
      serviceDate: record.service_date,
      mileage: record.mileage || 0,
      cost: record.cost || 0,
      notes: record.notes,
      receiptUrl: record.receipt_url,
      nextDueDate: record.next_due_date,
      nextDueMileage: record.next_due_mileage,
      priority: record.priority,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return { data: records, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single maintenance record by ID
 */
export async function getMaintenanceRecordById(
  id: string
): Promise<{ data: MaintenanceRecord | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching maintenance record:", error);
      return { data: null, error: error.message };
    }

    const record: MaintenanceRecord = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      serviceDate: data.service_date,
      mileage: data.mileage || 0,
      cost: data.cost || 0,
      notes: data.notes,
      receiptUrl: data.receipt_url,
      nextDueDate: data.next_due_date,
      nextDueMileage: data.next_due_mileage,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: record, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Create a new maintenance record and auto-generate reminder
 */
export async function createMaintenanceRecord(
  input: CreateMaintenanceInput
): Promise<{ data: MaintenanceRecord | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    // Get the maintenance category to calculate next due dates
    const category = getMaintenanceCategoryById(input.serviceCategory);
    let nextDueDate: string | undefined;
    let nextDueMileage: number | undefined;
    let priority = "medium";

    if (category) {
      priority = category.priority;

      // Calculate next due dates
      const nextDue = calculateNextDue(
        input.serviceDate,
        input.mileage,
        {
          timeIntervalMonths: category.defaultTimeIntervalMonths,
          mileageIntervalKm: category.defaultMileageIntervalKm,
        }
      );

      nextDueDate = nextDue.nextDueDate;
      nextDueMileage = nextDue.nextDueMileage;
    }

    // Insert maintenance record
    const { data, error } = await supabase
      .from("maintenance_logs")
      .insert({
        user_id: user.id,
        vehicle_id: input.vehicleId,
        service_type: input.serviceType,
        service_category: input.serviceCategory,
        service_date: input.serviceDate,
        mileage: input.mileage,
        cost: input.cost,
        notes: input.notes,
        receipt_url: input.receiptUrl,
        next_due_date: nextDueDate,
        next_due_mileage: nextDueMileage,
        priority: priority,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating maintenance record:", error);
      return { data: null, error: error.message };
    }

    // Create reminder for next service
    if (category && (nextDueDate || nextDueMileage)) {
      await supabase.from("reminders").insert({
        user_id: user.id,
        vehicle_id: input.vehicleId,
        title: `${category.name} Due`,
        reminder_type: category.name,
        service_category: input.serviceCategory,
        description: `Next ${category.name.toLowerCase()} is due based on your last service.`,
        due_date: nextDueDate,
        due_mileage: nextDueMileage,
        priority: priority,
        time_interval_months: category.defaultTimeIntervalMonths,
        mileage_interval_km: category.defaultMileageIntervalKm,
        status: "upcoming",
        is_completed: false,
      });
    }

    const record: MaintenanceRecord = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      serviceDate: data.service_date,
      mileage: data.mileage || 0,
      cost: data.cost || 0,
      notes: data.notes,
      receiptUrl: data.receipt_url,
      nextDueDate: data.next_due_date,
      nextDueMileage: data.next_due_mileage,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    revalidatePath(`/vehicles/${input.vehicleId}`);
    revalidatePath(`/vehicles/${input.vehicleId}/maintenance`);
    revalidatePath("/dashboard");

    return { data: record, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing maintenance record
 */
export async function updateMaintenanceRecord(
  input: UpdateMaintenanceInput
): Promise<{ data: MaintenanceRecord | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    // Recalculate next due dates
    const category = getMaintenanceCategoryById(input.serviceCategory);
    let nextDueDate: string | undefined;
    let nextDueMileage: number | undefined;
    let priority = "medium";

    if (category) {
      priority = category.priority;

      const nextDue = calculateNextDue(
        input.serviceDate,
        input.mileage,
        {
          timeIntervalMonths: category.defaultTimeIntervalMonths,
          mileageIntervalKm: category.defaultMileageIntervalKm,
        }
      );

      nextDueDate = nextDue.nextDueDate;
      nextDueMileage = nextDue.nextDueMileage;
    }

    const { data, error } = await supabase
      .from("maintenance_logs")
      .update({
        service_type: input.serviceType,
        service_category: input.serviceCategory,
        service_date: input.serviceDate,
        mileage: input.mileage,
        cost: input.cost,
        notes: input.notes,
        receipt_url: input.receiptUrl,
        next_due_date: nextDueDate,
        next_due_mileage: nextDueMileage,
        priority: priority,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating maintenance record:", error);
      return { data: null, error: error.message };
    }

    const record: MaintenanceRecord = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      serviceDate: data.service_date,
      mileage: data.mileage || 0,
      cost: data.cost || 0,
      notes: data.notes,
      receiptUrl: data.receipt_url,
      nextDueDate: data.next_due_date,
      nextDueMileage: data.next_due_mileage,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    revalidatePath(`/vehicles/${input.vehicleId}`);
    revalidatePath(`/vehicles/${input.vehicleId}/maintenance`);
    revalidatePath("/dashboard");

    return { data: record, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a maintenance record
 */
export async function deleteMaintenanceRecord(
  id: string,
  vehicleId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("maintenance_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting maintenance record:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath(`/vehicles/${vehicleId}/maintenance`);
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get maintenance statistics for a vehicle
 */
export async function getMaintenanceStats(vehicleId: string): Promise<{
  data: {
    totalRecords: number;
    totalCost: number;
    lastServiceDate: string | null;
    upcomingServices: number;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("service_date, cost, next_due_date")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching maintenance stats:", error);
      return { data: null, error: error.message };
    }

    const totalRecords = data.length;
    const totalCost = data.reduce((sum, record) => sum + (record.cost || 0), 0);
    const lastServiceDate = data.length > 0 ? data[0].service_date : null;
    
    const today = new Date();
    const upcomingServices = data.filter((record) => {
      if (!record.next_due_date) return false;
      const dueDate = new Date(record.next_due_date);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;

    return {
      data: {
        totalRecords,
        totalCost,
        lastServiceDate,
        upcomingServices,
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}
