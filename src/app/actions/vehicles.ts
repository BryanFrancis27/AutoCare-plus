'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateInitialReminders } from "./templates";
import { normalizeVehicle } from "@/lib/vehicles/vehicle-model";

const VEHICLE_IMAGE_BUCKET = "vehicles";
const DEFAULT_MAX_VEHICLE_IMAGE_SIZE_MB = 5;
const MAX_VEHICLE_IMAGE_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_VEHICLE_IMAGE_MAX_SIZE_MB ?? DEFAULT_MAX_VEHICLE_IMAGE_SIZE_MB
);
const MAX_VEHICLE_IMAGE_SIZE = MAX_VEHICLE_IMAGE_SIZE_MB * 1024 * 1024;

export async function getVehicleById(vehicleId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId)) return { data: null, error: "Vehicle not found", status: "missing" as const };
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
    .maybeSingle();

  if (error) {
    return { data: null, error: "Unable to load vehicle. Please try again.", status: "error" as const };
  }

  if (!data) return { data: null, error: "Vehicle not found", status: "missing" as const };
  const vehicle = normalizeVehicle(data);
  vehicle.image_url = await refreshVehiclePhoto(vehicle.image_url, user.id);
  return { data: vehicle, error: null };
}

export async function getUserVehicles() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const normalizedVehicles = await Promise.all((data ?? []).map(async (row: Record<string, unknown>) => {
    const vehicle = normalizeVehicle(row);
    vehicle.image_url = await refreshVehiclePhoto(vehicle.image_url, user.id);
    return vehicle;
  }));

  return { data: normalizedVehicles, error: null };
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
  transmission?: string;
  currentMileage?: number;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  notes?: string;
  imageUrl?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    make: vehicleData.make,
    model: vehicleData.model,
    year: vehicleData.year,
    vin: vehicleData.vin,
    plate_number: vehicleData.licensePlate,
    color: vehicleData.color,
    vehicle_type: vehicleData.vehicleType,
    powertrain: vehicleData.powertrain,
    transmission: vehicleData.transmission,
    current_mileage: vehicleData.currentMileage,
    purchase_date: vehicleData.purchaseDate,
    purchase_price: vehicleData.purchasePrice,
    notes: vehicleData.notes,
    image_url: vehicleData.imageUrl,
  };

  // Remove undefined fields to avoid writing nullable values explicitly.
  Object.keys(insertPayload).forEach((key) => {
    if (typeof insertPayload[key] === "undefined") {
      delete insertPayload[key];
    }
  });

  let vehicle: any = null;
  let error: { message: string } | null = null;
  const removedColumns = new Set<string>();

  while (true) {
    const result = await supabase
      .from("vehicles")
      .insert(insertPayload)
      .select()
      .single();

    vehicle = result.data;
    error = result.error;

    if (!error) {
      break;
    }

    const missingColumnMatch =
      error.message.match(/vehicles\.([a-zA-Z0-9_]+)/i) ||
      error.message.match(/'([a-zA-Z0-9_]+)'\s+column of\s+'vehicles'/i);
    const missingColumn = missingColumnMatch?.[1];

    if (!missingColumn || !(missingColumn in insertPayload) || removedColumns.has(missingColumn)) {
      break;
    }

    // Fallback image column names for legacy schemas.
    if (missingColumn === "image_url" && !removedColumns.has("photo_url")) {
      const imageValue = insertPayload.image_url;
      delete insertPayload.image_url;
      insertPayload.photo_url = imageValue;
      removedColumns.add("image_url");
      continue;
    }

    if (missingColumn === "photo_url" && !removedColumns.has("image")) {
      const imageValue = insertPayload.photo_url;
      delete insertPayload.photo_url;
      insertPayload.image = imageValue;
      removedColumns.add("photo_url");
      continue;
    }

    delete insertPayload[missingColumn];
    removedColumns.add(missingColumn);
  }

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

export async function updateVehicle(vehicleData: {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  vehicleType?: string;
  powertrain?: string;
  transmission?: string;
  currentMileage?: number;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  notes?: string;
  imageUrl?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const updatePayload: Record<string, unknown> = {
    make: vehicleData.make,
    model: vehicleData.model,
    year: vehicleData.year,
    vin: vehicleData.vin,
    plate_number: vehicleData.licensePlate || null,
    color: vehicleData.color,
    vehicle_type: vehicleData.vehicleType,
    powertrain: vehicleData.powertrain,
    transmission: vehicleData.transmission,
    current_mileage: typeof vehicleData.currentMileage === "number" ? vehicleData.currentMileage : null,
    purchase_date: vehicleData.purchaseDate,
    purchase_price: vehicleData.purchasePrice,
    notes: vehicleData.notes,
    image_url: vehicleData.imageUrl,
  };

  Object.keys(updatePayload).forEach((key) => {
    if (typeof updatePayload[key] === "undefined") {
      delete updatePayload[key];
    }
  });

  let data: any = null;
  let error: { message: string } | null = null;
  const removedColumns = new Set<string>();

  while (true) {
    const result = await supabase
      .from("vehicles")
      .update(updatePayload)
      .eq("id", vehicleData.id)
      .eq("user_id", user.id)
      .select()
      .single();

    data = result.data;
    error = result.error;

    if (!error) {
      break;
    }

    const missingColumnMatch =
      error.message.match(/vehicles\.([a-zA-Z0-9_]+)/i) ||
      error.message.match(/'([a-zA-Z0-9_]+)'\s+column of\s+'vehicles'/i);
    const missingColumn = missingColumnMatch?.[1];

    if (!missingColumn || !(missingColumn in updatePayload) || removedColumns.has(missingColumn)) {
      break;
    }

    // Fallback from plate_number to older license_plate schema when needed.
    if (missingColumn === "plate_number" && !removedColumns.has("license_plate")) {
      const plateValue = updatePayload.plate_number;
      delete updatePayload.plate_number;
      updatePayload.license_plate = plateValue;
      removedColumns.add("plate_number");
      continue;
    }

    // Fallback image column names for legacy schemas.
    if (missingColumn === "image_url" && !removedColumns.has("photo_url")) {
      const imageValue = updatePayload.image_url;
      delete updatePayload.image_url;
      updatePayload.photo_url = imageValue;
      removedColumns.add("image_url");
      continue;
    }

    if (missingColumn === "photo_url" && !removedColumns.has("image")) {
      const imageValue = updatePayload.photo_url;
      delete updatePayload.photo_url;
      updatePayload.image = imageValue;
      removedColumns.add("photo_url");
      continue;
    }

    delete updatePayload[missingColumn];
    removedColumns.add(missingColumn);
  }

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleData.id}`);
  revalidatePath("/dashboard");

  return { data, error: null };
}

export async function deleteVehicle(vehicleId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  // Remove dependent records first for schemas without ON DELETE CASCADE.
  await supabase
    .from("reminders")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id);

  await supabase
    .from("maintenance_logs")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id);

  await supabase
    .from("expenses")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id);

  const { data, error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");

  return { data, error: null };
}

export async function uploadVehicleImage(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const fileEntry = formData.get("file");

  if (!fileEntry || typeof fileEntry === "string" || !("arrayBuffer" in fileEntry)) {
    return { data: null, error: "No image file was provided." };
  }

  const file = fileEntry as File;

  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return { data: null, error: "Please upload a valid image file." };
  }

  if (file.size > MAX_VEHICLE_IMAGE_SIZE) {
    return {
      data: null,
      error: `File size must be less than ${MAX_VEHICLE_IMAGE_SIZE_MB}MB.`,
    };
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const safeExtension = fileExtension && /^[a-z0-9]+$/.test(fileExtension) ? fileExtension : "jpg";
  const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(VEHICLE_IMAGE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: "Photo upload is unavailable. Please try again or save without a photo." };
  }

  const { data: signedData } = await supabase.storage
    .from(VEHICLE_IMAGE_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 30);

  if (!signedData?.signedUrl) {
    return { data: null, error: "Photo preview is unavailable. Please try again or save without a photo." };
  }

  return {
    data: {
      filePath,
      displayUrl: signedData?.signedUrl ?? null,
    },
    error: null,
  };
}


async function refreshVehiclePhoto(source: string | null | undefined, userId: string): Promise<string | null> {
  if (!source) return source ?? null;
  try {
    const url = new URL(source);
    if (url.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return source;
    const prefix = '/storage/v1/object/sign/vehicles/';
    if (!url.pathname.startsWith(prefix)) return source;
    const objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!objectPath.startsWith(userId + '/') || objectPath.split('/').some(part => part === '..' || part === '.')) return source;
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.storage.from(VEHICLE_IMAGE_BUCKET).createSignedUrl(objectPath, 60 * 60 * 24 * 30);
    return data?.signedUrl ?? source;
  } catch { return source; }
}
