'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateInitialReminders } from "./templates";

export async function getVehicleById(vehicleId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createVehicle(vehicleData: {
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  vehicleType?: string;
  powertrain?: string;
  currentMileage?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
  imageUrl?: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  // Insert vehicle
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      user_id: user.id,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      vin: vehicleData.vin,
      license_plate: vehicleData.licensePlate,
      color: vehicleData.color,
      vehicle_type: vehicleData.vehicleType,
      powertrain: vehicleData.powertrain,
      current_mileage: vehicleData.currentMileage,
      purchase_date: vehicleData.purchaseDate,
      purchase_price: vehicleData.purchasePrice,
      notes: vehicleData.notes,
      image_url: vehicleData.imageUrl,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Generate initial maintenance reminders for the vehicle
  if (vehicle) {
    await generateInitialReminders(vehicle.id);
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");

  return { data: vehicle, error: null };
}

