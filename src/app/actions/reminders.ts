"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Reminder } from "@/types";
import { isMaintenanceOverdue, calculateDaysUntilDue } from "@/lib/maintenance";
import { revalidatePath } from "next/cache";

/**
 * Reminders Server Actions
 * Operations for fetching, creating, updating, and completing reminders
 */

export interface CreateReminderInput {
  vehicleId: string;
  title: string;
  reminderType: string;
  serviceCategory: string;
  description: string;
  dueDate?: string;
  dueMileage?: number;
  priority?: string;
  timeIntervalMonths?: number;
  mileageIntervalKm?: number;
  notes?: string;
}

export interface UpdateReminderInput extends CreateReminderInput {
  id: string;
}

/**
 * Get all reminders for the current user
 */
export async function getAllReminders(): Promise<{
  data: Reminder[] | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("reminders")
      .select("*, vehicles(make, model, year, plate_number)")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching reminders:", error);
      return { data: null, error: error.message };
    }

    const reminders: Reminder[] = data.map((record) => ({
      id: record.id,
      userId: record.user_id,
      vehicleId: record.vehicle_id,
      title: record.title,
      reminderType: record.reminder_type || record.title,
      serviceCategory: record.service_category,
      description: record.description || "",
      dueDate: record.due_date,
      dueMileage: record.due_mileage,
      priority: record.priority,
      timeIntervalMonths: record.time_interval_months,
      mileageIntervalKm: record.mileage_interval_km,
      status: record.status,
      isCompleted: record.is_completed,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return { data: reminders, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Get reminders for a specific vehicle
 */
export async function getRemindersForVehicle(
  vehicleId: string
): Promise<{ data: Reminder[] | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching vehicle reminders:", error);
      return { data: null, error: error.message };
    }

    const reminders: Reminder[] = data.map((record) => ({
      id: record.id,
      userId: record.user_id,
      vehicleId: record.vehicle_id,
      title: record.title,
      reminderType: record.reminder_type || record.title,
      serviceCategory: record.service_category,
      description: record.description || "",
      dueDate: record.due_date,
      dueMileage: record.due_mileage,
      priority: record.priority,
      timeIntervalMonths: record.time_interval_months,
      mileageIntervalKm: record.mileage_interval_km,
      status: record.status,
      isCompleted: record.is_completed,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return { data: reminders, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Get upcoming reminders (within 30 days)
 */
export async function getUpcomingReminders(): Promise<{
  data: Reminder[] | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("reminders")
      .select("*, vehicles(make, model, plate_number)")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .gte("due_date", today)
      .lte("due_date", thirtyDaysLaterStr)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching upcoming reminders:", error);
      return { data: null, error: error.message };
    }

    const reminders: Reminder[] = data.map((record) => ({
      id: record.id,
      userId: record.user_id,
      vehicleId: record.vehicle_id,
      title: record.title,
      reminderType: record.reminder_type || record.title,
      serviceCategory: record.service_category,
      description: record.description || "",
      dueDate: record.due_date,
      dueMileage: record.due_mileage,
      priority: record.priority,
      timeIntervalMonths: record.time_interval_months,
      mileageIntervalKm: record.mileage_interval_km,
      status: record.status,
      isCompleted: record.is_completed,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return { data: reminders, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Get overdue reminders
 */
export async function getOverdueReminders(): Promise<{
  data: Reminder[] | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("reminders")
      .select("*, vehicles(make, model, plate_number)")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .lt("due_date", today)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching overdue reminders:", error);
      return { data: null, error: error.message };
    }

    const reminders: Reminder[] = data.map((record) => ({
      id: record.id,
      userId: record.user_id,
      vehicleId: record.vehicle_id,
      title: record.title,
      reminderType: record.reminder_type || record.title,
      serviceCategory: record.service_category,
      description: record.description || "",
      dueDate: record.due_date,
      dueMileage: record.due_mileage,
      priority: record.priority,
      timeIntervalMonths: record.time_interval_months,
      mileageIntervalKm: record.mileage_interval_km,
      status: "overdue",
      isCompleted: record.is_completed,
      notes: record.notes,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return { data: reminders, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single reminder by ID
 */
export async function getReminderById(
  id: string
): Promise<{ data: Reminder | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching reminder:", error);
      return { data: null, error: error.message };
    }

    const reminder: Reminder = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      title: data.title,
      reminderType: data.reminder_type || data.title,
      serviceCategory: data.service_category,
      description: data.description || "",
      dueDate: data.due_date,
      dueMileage: data.due_mileage,
      priority: data.priority,
      timeIntervalMonths: data.time_interval_months,
      mileageIntervalKm: data.mileage_interval_km,
      status: data.status,
      isCompleted: data.is_completed,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: reminder, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Create a new reminder
 */
export async function createReminder(
  input: CreateReminderInput
): Promise<{ data: Reminder | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        vehicle_id: input.vehicleId,
        title: input.title,
        reminder_type: input.reminderType,
        service_category: input.serviceCategory,
        description: input.description,
        due_date: input.dueDate,
        due_mileage: input.dueMileage,
        priority: input.priority || "medium",
        time_interval_months: input.timeIntervalMonths,
        mileage_interval_km: input.mileageIntervalKm,
        status: "upcoming",
        is_completed: false,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reminder:", error);
      return { data: null, error: error.message };
    }

    const reminder: Reminder = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      title: data.title,
      reminderType: data.reminder_type,
      serviceCategory: data.service_category,
      description: data.description,
      dueDate: data.due_date,
      dueMileage: data.due_mileage,
      priority: data.priority,
      timeIntervalMonths: data.time_interval_months,
      mileageIntervalKm: data.mileage_interval_km,
      status: data.status,
      isCompleted: data.is_completed,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    revalidatePath(`/vehicles/${input.vehicleId}`);
    revalidatePath("/reminders");
    revalidatePath("/dashboard");

    return { data: reminder, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing reminder
 */
export async function updateReminder(
  input: UpdateReminderInput
): Promise<{ data: Reminder | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("reminders")
      .update({
        title: input.title,
        reminder_type: input.reminderType,
        service_category: input.serviceCategory,
        description: input.description,
        due_date: input.dueDate,
        due_mileage: input.dueMileage,
        priority: input.priority,
        time_interval_months: input.timeIntervalMonths,
        mileage_interval_km: input.mileageIntervalKm,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating reminder:", error);
      return { data: null, error: error.message };
    }

    const reminder: Reminder = {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      title: data.title,
      reminderType: data.reminder_type,
      serviceCategory: data.service_category,
      description: data.description,
      dueDate: data.due_date,
      dueMileage: data.due_mileage,
      priority: data.priority,
      timeIntervalMonths: data.time_interval_months,
      mileageIntervalKm: data.mileage_interval_km,
      status: data.status,
      isCompleted: data.is_completed,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    revalidatePath(`/vehicles/${input.vehicleId}`);
    revalidatePath("/reminders");
    revalidatePath("/dashboard");

    return { data: reminder, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}

/**
 * Complete a reminder (mark as done)
 */
export async function completeReminder(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("reminders")
      .update({
        is_completed: true,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error completing reminder:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/reminders");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Snooze a reminder by updating only its due date
 */
export async function snoozeReminder(
  id: string,
  daysToSnooze: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Calculate new due date
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + daysToSnooze);

    const { error } = await supabase
      .from("reminders")
      .update({
        due_date: newDueDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error snoozing reminder:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/reminders");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(
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
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting reminder:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/reminders");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get reminder counts for dashboard
 */
export async function getReminderCounts(): Promise<{
  data: {
    total: number;
    upcoming: number;
    overdue: number;
    completed: number;
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
      .from("reminders")
      .select("is_completed, due_date, status")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching reminder counts:", error);
      return { data: null, error: error.message };
    }

    const today = new Date().toISOString().split("T")[0];

    const total = data.length;
    const completed = data.filter((r) => r.is_completed).length;
    const overdue = data.filter(
      (r) => !r.is_completed && r.due_date && r.due_date < today
    ).length;
    const upcoming = data.filter(
      (r) => !r.is_completed && r.due_date && r.due_date >= today
    ).length;

    return {
      data: {
        total,
        upcoming,
        overdue,
        completed,
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "An unexpected error occurred" };
  }
}
