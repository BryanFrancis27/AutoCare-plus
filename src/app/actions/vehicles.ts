'use server';

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateInitialReminders } from "./templates";

const VEHICLE_IMAGE_BUCKET = "vehicles";
const DEFAULT_MAX_VEHICLE_IMAGE_SIZE_MB = 5;
const MAX_VEHICLE_IMAGE_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_VEHICLE_IMAGE_MAX_SIZE_MB ?? DEFAULT_MAX_VEHICLE_IMAGE_SIZE_MB
);
const MAX_VEHICLE_IMAGE_SIZE = MAX_VEHICLE_IMAGE_SIZE_MB * 1024 * 1024;

async function ensureVehicleImageBucket() {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket(
    VEHICLE_IMAGE_BUCKET
  );

  if (bucket && !bucketError) {
    if (!bucket.public) {
      const { error: updateBucketError } = await supabaseAdmin.storage.updateBucket(
        VEHICLE_IMAGE_BUCKET,
        {
          public: true,
          fileSizeLimit: MAX_VEHICLE_IMAGE_SIZE,
          allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
        }
      );

      if (updateBucketError) {
        return { error: updateBucketError.message };
      }
    }

    return { error: null };
  }

  if (bucketError && !/not found/i.test(bucketError.message)) {
    return { error: bucketError.message };
  }

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(
    VEHICLE_IMAGE_BUCKET,
    {
      public: true,
      fileSizeLimit: MAX_VEHICLE_IMAGE_SIZE,
      allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
    }
  );

  if (createBucketError && !/already exists/i.test(createBucketError.message)) {
    return { error: createBucketError.message };
  }

  return { error: null };
}

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

  const normalizedVehicles = (data ?? []).map((vehicle: any) => ({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate_number: vehicle.plate_number ?? vehicle.license_plate ?? null,
    color: vehicle.color ?? null,
    vehicle_type: vehicle.vehicle_type ?? null,
    powertrain: vehicle.powertrain ?? null,
    transmission: vehicle.transmission ?? null,
    current_mileage: vehicle.current_mileage ?? null,
    purchase_date: vehicle.purchase_date ?? null,
    purchase_price: vehicle.purchase_price ?? null,
    notes: vehicle.notes ?? null,
    image_url: vehicle.image_url ?? vehicle.photo_url ?? vehicle.image ?? null,
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
  purchaseDate?: string;
  purchasePrice?: number;
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
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const fileEntry = formData.get("file");

  if (!fileEntry || typeof fileEntry === "string" || !("arrayBuffer" in fileEntry)) {
    return { data: null, error: "No image file was provided." };
  }

  const file = fileEntry as File;

  if (!file.type.startsWith("image/")) {
    return { data: null, error: "Please upload a valid image file." };
  }

  if (file.size > MAX_VEHICLE_IMAGE_SIZE) {
    return {
      data: null,
      error: `File size must be less than ${MAX_VEHICLE_IMAGE_SIZE_MB}MB.`,
    };
  }

  const bucketResult = await ensureVehicleImageBucket();

  if (bucketResult.error) {
    return { data: null, error: bucketResult.error };
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const safeExtension = fileExtension && /^[a-z0-9]+$/.test(fileExtension) ? fileExtension : "jpg";
  const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(VEHICLE_IMAGE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  const { data } = supabaseAdmin.storage.from(VEHICLE_IMAGE_BUCKET).getPublicUrl(filePath);

  const { data: signedData } = await supabaseAdmin.storage
    .from(VEHICLE_IMAGE_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 30);

  return {
    data: {
      filePath,
      publicUrl: data.publicUrl,
      displayUrl: signedData?.signedUrl ?? data.publicUrl,
    },
    error: null,
  };
}

