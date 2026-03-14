-- AutoCare+ Database Schema Migration
-- Adds maintenance system fields to existing tables
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- 1. Update VEHICLES table
-- ============================================

-- Add new columns for vehicle classification
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'sedan',
ADD COLUMN IF NOT EXISTS powertrain TEXT NOT NULL DEFAULT 'gasoline',
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS transmission TEXT,
ADD COLUMN IF NOT EXISTS current_mileage INTEGER,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add check constraints for valid values
ALTER TABLE vehicles
ADD CONSTRAINT vehicles_vehicle_type_check 
CHECK (vehicle_type IN ('sedan', 'hatchback', 'suv', 'pickup', 'van', 'hybrid', 'ev'));

ALTER TABLE vehicles
ADD CONSTRAINT vehicles_powertrain_check 
CHECK (powertrain IN ('gasoline', 'diesel', 'hybrid', 'electric'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicles_transmission_check'
  ) THEN
    ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_transmission_check
    CHECK (transmission IN ('Automatic', 'Manual', 'CVT', 'Semi-Automatic'));
  END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_powertrain ON vehicles(powertrain);

-- ============================================
-- 2. Update MAINTENANCE_LOGS table
-- ============================================

-- Add new columns for enhanced maintenance tracking
ALTER TABLE maintenance_logs
ADD COLUMN IF NOT EXISTS service_category TEXT NOT NULL DEFAULT 'general-inspection',
ADD COLUMN IF NOT EXISTS next_due_date DATE,
ADD COLUMN IF NOT EXISTS next_due_mileage INTEGER,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';

-- Add check constraint for priority
ALTER TABLE maintenance_logs
ADD CONSTRAINT maintenance_logs_priority_check 
CHECK (priority IN ('high', 'medium', 'low'));

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_service_category ON maintenance_logs(service_category);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_next_due_date ON maintenance_logs(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_priority ON maintenance_logs(priority);

-- ============================================
-- 3. Update REMINDERS table
-- ============================================

-- Add new columns for enhanced reminder functionality
-- Note: Your existing schema has 'title', 'due_date', 'due_mileage', 'status', 'notes'
-- We're adding new fields while keeping existing ones
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS service_category TEXT NOT NULL DEFAULT 'general-inspection',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS time_interval_months INTEGER,
ADD COLUMN IF NOT EXISTS mileage_interval_km INTEGER,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT false;

-- Add check constraint for priority
ALTER TABLE reminders
ADD CONSTRAINT reminders_priority_check 
CHECK (priority IN ('high', 'medium', 'low'));

-- Rename 'title' to 'reminder_type' for consistency (optional, keeps both for compatibility)
-- If title exists, we'll use it as reminder_type via a view or keep both
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS reminder_type TEXT;

-- Update reminder_type from title if it's null
UPDATE reminders SET reminder_type = title WHERE reminder_type IS NULL AND title IS NOT NULL;

-- Set is_completed based on existing status field
UPDATE reminders SET is_completed = (status = 'completed') WHERE is_completed = false;

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS idx_reminders_service_category ON reminders(service_category);
CREATE INDEX IF NOT EXISTS idx_reminders_priority ON reminders(priority);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_is_completed ON reminders(is_completed);

-- Composite index for common queries (upcoming reminders)
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_status 
ON reminders(vehicle_id, is_completed, due_date);

-- ============================================
-- 4. Add Comments for Documentation
-- ============================================

COMMENT ON COLUMN vehicles.vehicle_type IS 'Vehicle classification: sedan, hatchback, suv, pickup, van, hybrid, ev';
COMMENT ON COLUMN vehicles.powertrain IS 'Engine/powertrain type: gasoline, diesel, hybrid, electric';
COMMENT ON COLUMN vehicles.color IS 'Vehicle exterior color';
COMMENT ON COLUMN vehicles.transmission IS 'Transmission type: Automatic, Manual, CVT, Semi-Automatic';
COMMENT ON COLUMN vehicles.current_mileage IS 'Current odometer reading in kilometers';
COMMENT ON COLUMN vehicles.purchase_date IS 'Vehicle purchase date';
COMMENT ON COLUMN vehicles.purchase_price IS 'Vehicle purchase price';
COMMENT ON COLUMN vehicles.notes IS 'Freeform notes about the vehicle';
COMMENT ON COLUMN vehicles.image_url IS 'Public or signed URL for the vehicle profile image stored in Supabase Storage';

COMMENT ON COLUMN maintenance_logs.service_category IS 'Standardized maintenance category (oil-change, tire-rotation, etc.)';
COMMENT ON COLUMN maintenance_logs.next_due_date IS 'Calculated next service due date';
COMMENT ON COLUMN maintenance_logs.next_due_mileage IS 'Calculated next service due mileage in km';
COMMENT ON COLUMN maintenance_logs.priority IS 'Service priority: high, medium, low';

COMMENT ON COLUMN reminders.service_category IS 'Maintenance category this reminder is for';
COMMENT ON COLUMN reminders.description IS 'Human-readable reminder description';
COMMENT ON COLUMN reminders.priority IS 'Reminder priority: high, medium, low';
COMMENT ON COLUMN reminders.time_interval_months IS 'Time-based interval in months';
COMMENT ON COLUMN reminders.mileage_interval_km IS 'Mileage-based interval in kilometers';

-- ============================================
-- 5. Update Row Level Security (RLS) Policies
-- ============================================

-- Ensure RLS is enabled on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
-- (This ensures policies work with new columns)

-- VEHICLES policies
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
CREATE POLICY "Users can view their own vehicles"
ON vehicles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
CREATE POLICY "Users can insert their own vehicles"
ON vehicles FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
CREATE POLICY "Users can update their own vehicles"
ON vehicles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
CREATE POLICY "Users can delete their own vehicles"
ON vehicles FOR DELETE
USING (auth.uid() = user_id);

-- MAINTENANCE_LOGS policies
-- Note: Existing policies "Logs owner select" and "Logs owner crud" already exist
-- We'll drop and recreate them to ensure they work with new columns

DROP POLICY IF EXISTS "Logs owner select" ON maintenance_logs;
DROP POLICY IF EXISTS "Logs owner crud" ON maintenance_logs;

CREATE POLICY "Logs owner select"
ON maintenance_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Logs owner crud"
ON maintenance_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- REMINDERS policies
-- Note: Existing policies "Reminders owner select" and "Reminders owner crud" already exist
-- We'll drop and recreate them to ensure they work with new columns

DROP POLICY IF EXISTS "Reminders owner select" ON reminders;
DROP POLICY IF EXISTS "Reminders owner crud" ON reminders;

CREATE POLICY "Reminders owner select"
ON reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Reminders owner crud"
ON reminders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. Create Helper Function (Optional)
-- ============================================

-- Function to automatically update vehicle mileage when maintenance is logged
CREATE OR REPLACE FUNCTION update_vehicle_mileage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vehicle's current mileage if the new maintenance record has higher mileage
  UPDATE vehicles
  SET current_mileage = NEW.mileage,
      updated_at = NOW()
  WHERE id = NEW.vehicle_id
  AND (current_mileage IS NULL OR current_mileage < NEW.mileage);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_vehicle_mileage ON maintenance_logs;
CREATE TRIGGER trigger_update_vehicle_mileage
AFTER INSERT OR UPDATE ON maintenance_logs
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_mileage();

-- ============================================
-- Migration Complete
-- ============================================

-- Verify the migration
SELECT 'Migration completed successfully!' AS status;