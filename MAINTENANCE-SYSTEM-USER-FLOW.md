# AutoCare+ Maintenance System - Comprehensive User Flow

## Overview
This document outlines the complete user journey through the AutoCare+ maintenance tracking system, from initial vehicle setup through ongoing maintenance management.

---

## 🚗 User Flow 1: Adding a New Vehicle

### Step 1: Access Vehicle Creation
- User logs into AutoCare+
- Navigates to Dashboard
- Clicks "Add Vehicle" button in VehiclesSection

### Step 2: Enter Vehicle Details
**AddVehicleModal Form:**
- **Make:** Select from dropdown (Honda, Toyota, Ford, etc.) or enter custom
- **Model:** Text input (e.g., "Civic", "Camry")
- **Year:** Number input (e.g., 2020)
- **License Plate:** Text input (e.g., "ABC123")
- **Vehicle Type:** Select from:
  - Sedan
  - Hatchback
  - SUV
  - Pickup Truck
  - Van
  - Hybrid
  - Electric Vehicle (EV)
- **Powertrain:** Auto-detected based on type, can override:
  - Gasoline
  - Diesel
  - Hybrid
  - Electric
- **Current Mileage:** Optional number input (km)

### Step 3: Automatic Processing
When user clicks "Add Vehicle":

1. **Vehicle is created** in database
2. **Vehicle Classification** happens automatically:
   ```
   classifyVehicle(make, model, year)
   → Returns: { type: 'sedan', powertrain: 'gasoline', ageGroup: 'mid-life' }
   ```

3. **Maintenance Template Selection:**
   ```
   getVehicleMaintenanceTemplate(vehicleId)
   → Selects appropriate template based on:
      - Vehicle type (sedan uses standard schedule)
      - Powertrain (EV skips oil changes, adds battery checks)
      - Age group (older vehicles get more frequent inspections)
      - Manufacturer (Toyota gets specific adjustments)
   ```

4. **Initial Reminders Generated:**
   ```
   generateInitialReminders(vehicleId)
   → Creates reminders for ALL maintenance categories:
      ✓ Oil Change (if not EV)
      ✓ Tire Rotation
      ✓ Brake Inspection
      ✓ Battery Check
      ✓ Air Filter Replacement
      ✓ Cabin Filter
      ✓ Coolant Flush
      ✓ Transmission Service
      ✓ Spark Plug Replacement
      ✓ Timing Belt/Chain
      ✓ Brake Fluid Flush
      ✓ Power Steering Fluid
      ✓ Differential Service
      ✓ Wheel Alignment
      ✓ Suspension Check
      ✓ Exhaust Inspection
      ✓ Wiper Blade Replacement
      ✓ Light Bulb Check
      ✓ General Safety Inspection
      ✓ Annual Vehicle Inspection
   ```

### Step 4: Result
- ✅ Vehicle added successfully
- ✅ User sees success message: "Vehicle added! We've set up recommended maintenance reminders."
- ✅ Vehicle appears in Dashboard vehicles list
- ✅ 15-20 reminders created (varies by vehicle type)
- ✅ User redirected to vehicle details page

**Example Output for 2020 Honda Civic:**
- Vehicle Type: Sedan
- Powertrain: Gasoline
- Age Group: Mid-life (4-7 years)
- Reminders Created: 19 total
  - Oil Change: Due in 6 months / 8,000 km
  - Tire Rotation: Due in 6 months / 10,000 km
  - Brake Inspection: Due in 12 months
  - etc.

---

## 📊 User Flow 2: Viewing Vehicle Dashboard

### Step 1: Access Dashboard
- User lands on `/dashboard` after login
- Dashboard displays comprehensive overview

### Step 2: Dashboard Sections

#### A. **Metrics Overview** (Top Cards)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total Vehicles  │ Total Expenses  │ Due This Month  │
│      3          │    $1,245.00    │       5         │
└─────────────────┴─────────────────┴─────────────────┘
```
- **Total Vehicles:** Count of user's registered vehicles
- **Total Expenses:** Sum of all maintenance costs
- **Due This Month:** Count of reminders due in next 30 days

#### B. **Vehicles Section**
Shows all vehicles with quick stats:
```
Honda Civic 2020 (ABC123)
├─ Next Service: Oil Change (in 2 weeks)
├─ Current Mileage: 45,000 km
└─ [View Details] [Maintenance] [Delete]

Toyota Camry 2018 (XYZ789)
├─ Next Service: Tire Rotation (overdue!)
├─ Current Mileage: 78,000 km
└─ [View Details] [Maintenance] [Delete]
```

#### C. **Activity Feed**
Recent maintenance activities:
```
🔧 Oil Change - Honda Civic
   Jan 10, 2026 • $65.00

🔄 Tire Rotation - Toyota Camry
   Jan 5, 2026 • $45.00

🔍 Brake Inspection - Honda Civic
   Dec 28, 2025 • $0.00 (Self-inspection)
```

### Step 3: Navigation Options
User can:
- Click vehicle name → Go to vehicle details
- Click "Maintenance" → Go to maintenance logs
- Click "Add Vehicle" → Open add vehicle modal
- View upcoming reminders in sidebar (if implemented)

---

## 🔧 User Flow 3: Logging Maintenance

### Step 1: Navigate to Maintenance Logs
**Option A:** From Dashboard
- Click "Maintenance" button on vehicle card

**Option B:** From Vehicle Details
- Click vehicle → Click "Maintenance Logs" tab

**Option C:** Direct Navigation
- Use sidebar menu → Vehicles → Select vehicle → Maintenance

### Step 2: View Existing Maintenance Logs
User sees table of all past maintenance:
```
┌──────────────┬─────────────┬──────────┬─────────┬──────────┬──────────┐
│ Date         │ Category    │ Mileage  │ Cost    │ Priority │ Actions  │
├──────────────┼─────────────┼──────────┼─────────┼──────────┼──────────┤
│ Jan 10, 2026 │ Oil Change  │ 45,000km │ $65.00  │ High     │ Edit/Del │
│ Dec 15, 2025 │ Tire Rot.   │ 42,000km │ $45.00  │ Medium   │ Edit/Del │
│ Nov 20, 2025 │ Brake Check │ 40,000km │ $0.00   │ Medium   │ Edit/Del │
└──────────────┴─────────────┴──────────┴─────────┴──────────┴──────────┘
```

### Step 3: Click "Add Maintenance"
Opens form to log new maintenance:

#### Form Fields:
1. **Service Category** (Dropdown - pre-populated from templates):
   - Oil Change
   - Tire Rotation
   - Brake Inspection
   - Battery Check
   - Air Filter Replacement
   - ... (all 20 categories)

2. **Service Date** (Date picker):
   - Default: Today
   - Can select past dates

3. **Current Mileage** (Optional number):
   - "What was the odometer reading?"
   - Unit: Kilometers

4. **Cost** (Optional number):
   - "How much did this service cost?"
   - Format: $0.00

5. **Service Provider** (Optional text):
   - "Where was this service performed?"
   - Examples: "Honda Dealership", "Quick Lube", "DIY"

6. **Notes** (Optional textarea):
   - "Any additional details?"
   - Examples: "Replaced with synthetic oil", "Found worn brake pads"

7. **Receipt Upload** (Optional file):
   - "Upload receipt (optional)"
   - Accepts: PDF, JPG, PNG

### Step 4: Form Submission & Automatic Processing

When user clicks "Save Maintenance":

1. **Validation:**
   - Service category required
   - Service date required
   - Cost must be positive (if provided)
   - Mileage must be positive (if provided)

2. **Record Creation:**
   ```javascript
   createMaintenanceRecord({
     vehicleId: "...",
     userId: "...",
     serviceCategory: "oil-change",
     serviceType: "Oil Change",
     serviceDate: "2026-01-10",
     mileage: 45000,
     cost: 65.00,
     notes: "Full synthetic 5W-30",
     priority: "high" // Auto-calculated
   })
   ```

3. **Automatic Next Due Date Calculation:**
   ```javascript
   // System looks up template for oil-change:
   Template: {
     timeInterval: 6 months,
     mileageInterval: 8000 km
   }
   
   // Calculates next due:
   nextDueDate = serviceDate + 6 months = July 10, 2026
   nextDueMileage = 45000 + 8000 = 53,000 km
   ```

4. **Priority Calculation:**
   ```javascript
   // Based on time/mileage intervals:
   if (interval <= 3 months OR <= 5000 km) → HIGH
   if (interval <= 12 months OR <= 15000 km) → MEDIUM
   else → LOW
   ```

5. **Reminder Generation:**
   ```javascript
   createReminder({
     vehicleId: "...",
     userId: "...",
     reminderType: "maintenance",
     serviceCategory: "oil-change",
     title: "Oil Change Due",
     description: "Your Honda Civic is due for an oil change",
     dueDate: "2026-07-10",
     dueMileage: 53000,
     priority: "high",
     timeIntervalMonths: 6,
     mileageIntervalKm: 8000
   })
   ```

6. **Vehicle Mileage Update (Automatic Trigger):**
   ```sql
   -- Database trigger automatically updates vehicle.current_mileage
   -- if maintenance.mileage > vehicle.current_mileage
   UPDATE vehicles 
   SET current_mileage = 45000 
   WHERE id = vehicleId
   ```

### Step 5: Success Response
- ✅ Maintenance record saved
- ✅ Vehicle mileage updated to 45,000 km
- ✅ Next reminder created for July 10, 2026
- ✅ User sees success message: "Maintenance logged successfully! Next service due July 10, 2026"
- ✅ Page refreshes showing new record
- ✅ Dashboard metrics update

**Database State After Logging:**
```
maintenance_logs:
├─ id: uuid
├─ service_category: "oil-change"
├─ service_date: "2026-01-10"
├─ mileage: 45000
├─ cost: 65.00
├─ next_due_date: "2026-07-10"
├─ next_due_mileage: 53000
└─ priority: "high"

reminders:
├─ id: uuid
├─ title: "Oil Change Due"
├─ due_date: "2026-07-10"
├─ due_mileage: 53000
├─ priority: "high"
└─ is_completed: false

vehicles:
└─ current_mileage: 45000 (auto-updated)
```

---

## 🔔 User Flow 4: Managing Reminders

### Step 1: View Reminders
**Option A:** Dashboard - Upcoming Reminders Widget
```
⚠️ Upcoming Maintenance (5)
├─ Oil Change - Honda Civic (in 2 weeks)
├─ Tire Rotation - Toyota Camry (OVERDUE)
├─ Brake Inspection - Honda Civic (in 1 month)
└─ [View All Reminders]
```

**Option B:** Reminders Page
- Navigate to `/reminders` from sidebar
- See comprehensive list of ALL reminders

### Step 2: Reminders Page Layout

#### Filters & Sorting:
```
┌──────────────────────────────────────┐
│ [All Vehicles ▼] [All Status ▼]     │
│ [Sort: Due Date ▼]                   │
└──────────────────────────────────────┘
```

- **Vehicle Filter:** All Vehicles, Honda Civic, Toyota Camry
- **Status Filter:** All, Upcoming, Overdue, Completed
- **Sort Options:** Due Date, Priority, Vehicle

#### Reminder Cards:
```
┌─────────────────────────────────────────────────────┐
│ 🔴 OVERDUE                                          │
│ Tire Rotation - Toyota Camry 2018                  │
│ Due: Jan 5, 2026 (10 days ago)                     │
│ Due at: 75,000 km (Current: 78,000 km)             │
│ ───────────────────────────────────────────────    │
│ [Complete] [Snooze] [View Details]                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🟡 UPCOMING                                         │
│ Oil Change - Honda Civic 2020                      │
│ Due: Jan 28, 2026 (in 13 days)                     │
│ Due at: 53,000 km (Current: 45,000 km)             │
│ ───────────────────────────────────────────────    │
│ [Complete] [Snooze] [View Details]                 │
└─────────────────────────────────────────────────────┘
```

### Step 3: Reminder Actions

#### Action A: View Details
- Click "View Details"
- Opens reminder detail page: `/reminders/[id]`

**Reminder Detail Page Shows:**
```
Oil Change Reminder
Honda Civic 2020 (ABC123)

Status: Upcoming
Priority: High

Due Information:
├─ Due Date: January 28, 2026 (in 13 days)
├─ Due Mileage: 53,000 km
└─ Current Mileage: 45,000 km

Service Information:
├─ Category: Oil Change
├─ Description: Your Honda Civic is due for an oil change
├─ Recommended Interval: Every 6 months or 8,000 km
└─ Last Performed: July 10, 2025

History:
├─ July 10, 2025 - Oil Change at 37,000 km ($65.00)
├─ January 15, 2025 - Oil Change at 29,000 km ($60.00)
└─ July 20, 2024 - Oil Change at 21,000 km ($55.00)

Actions:
[Mark as Complete] [Snooze for 1 Week] [Snooze for 1 Month] [Delete]
```

#### Action B: Complete Reminder
Click "Complete" button:

1. **Opens Quick Complete Form:**
   ```
   ┌────────────────────────────────────┐
   │ Complete: Oil Change               │
   ├────────────────────────────────────┤
   │ Service Date: [Today ▼]            │
   │ Mileage: [45000] km                │
   │ Cost: [$___.00]                    │
   │ Notes: [Optional...]               │
   ├────────────────────────────────────┤
   │ [Cancel] [Complete & Log Service]  │
   └────────────────────────────────────┘
   ```

2. **When submitted, system automatically:**
   - ✅ Marks reminder as completed
   - ✅ Creates maintenance record
   - ✅ Calculates next due date
   - ✅ Generates new reminder for next service
   - ✅ Updates vehicle mileage

3. **User sees confirmation:**
   ```
   ✓ Service logged successfully!
   Next oil change due: July 28, 2026
   ```

#### Action C: Snooze Reminder
Click "Snooze":

1. **Snooze Options Modal:**
   ```
   ┌────────────────────────────────────┐
   │ Snooze Reminder                    │
   ├────────────────────────────────────┤
   │ ○ 1 Week                           │
   │ ○ 2 Weeks                          │
   │ ○ 1 Month                          │
   │ ○ Custom Date: [Date Picker]      │
   ├────────────────────────────────────┤
   │ [Cancel] [Snooze]                  │
   └────────────────────────────────────┘
   ```

2. **After snoozing:**
   - Due date pushed back by selected duration
   - Reminder stays in "upcoming" status
   - User sees: "Reminder snoozed until Feb 5, 2026"

#### Action D: Delete Reminder
- Click delete icon
- Confirmation: "Are you sure? This cannot be undone."
- If confirmed: Reminder permanently deleted
- Note: Past maintenance records are NOT deleted

### Step 4: Reminder Notifications

**Future Enhancement - Currently Manual:**
Users need to check dashboard/reminders page. In production, you could add:
- Email notifications
- SMS reminders
- Push notifications
- Browser notifications

---

## 🚙 User Flow 5: Vehicle Details Page

### Step 1: Navigate to Vehicle
- Dashboard → Click vehicle card → Opens vehicle details
- URL: `/vehicles/[vehicleId]`

### Step 2: Vehicle Details Overview

```
┌─────────────────────────────────────────────────────┐
│ Honda Civic 2020                                    │
│ License Plate: ABC123                               │
├─────────────────────────────────────────────────────┤
│ Vehicle Classification:                             │
│ ├─ Type: Sedan                                      │
│ ├─ Powertrain: Gasoline                            │
│ ├─ Age Group: Mid-life (4-7 years)                 │
│ └─ Current Mileage: 45,000 km                      │
├─────────────────────────────────────────────────────┤
│ Maintenance Summary:                                │
│ ├─ Total Services: 15                              │
│ ├─ Total Cost: $845.00                             │
│ ├─ Active Reminders: 8                             │
│ └─ Overdue Services: 1                             │
└─────────────────────────────────────────────────────┘

Tabs: [Overview] [Maintenance] [Reminders] [Expenses]
```

### Step 3: Maintenance Tab

**Shows:**
1. **Upcoming Services** (Next 3-5 services)
   ```
   ⏰ Next Services:
   ├─ Oil Change (in 13 days / 8,000 km)
   ├─ Tire Rotation (in 2 months / 12,000 km)
   └─ Brake Inspection (in 6 months)
   ```

2. **Maintenance Schedule** (All recommended services)
   ```
   📋 Maintenance Schedule:
   
   Every 6 months / 8,000 km:
   ├─ Oil Change [$60-80]
   └─ Filter Check
   
   Every 10,000 km:
   ├─ Tire Rotation [$40-60]
   └─ Fluid Top-up
   
   Every 12 months:
   ├─ Brake Inspection [$0-50]
   ├─ Battery Check
   └─ General Safety Inspection
   
   Every 2 years / 30,000 km:
   ├─ Coolant Flush [$80-120]
   ├─ Transmission Service [$150-250]
   └─ Brake Fluid Flush [$70-100]
   ```

3. **Recent Maintenance** (Last 5 services)
   ```
   📝 Recent Services:
   ├─ Jan 10, 2026 - Oil Change ($65)
   ├─ Dec 15, 2025 - Tire Rotation ($45)
   ├─ Nov 20, 2025 - Brake Inspection ($0)
   ├─ Oct 5, 2025 - Air Filter ($25)
   └─ Aug 18, 2025 - Battery Check ($0)
   ```

4. **Quick Actions**
   ```
   [Log New Service] [View All Records] [Edit Vehicle]
   ```

### Step 4: Reminders Tab
- Shows all reminders specific to this vehicle
- Same card layout as main reminders page
- Filtered to only this vehicle

### Step 5: Expenses Tab
Shows cost breakdown:
```
💰 Maintenance Costs (2026):
├─ Total: $845.00
├─ Average per Service: $56.33
└─ By Category:
    ├─ Oil Changes: $195.00 (3 services)
    ├─ Tire Services: $135.00 (3 services)
    ├─ Brake Work: $250.00 (2 services)
    └─ Other: $265.00 (7 services)

📊 Monthly Breakdown:
January: $110.00
December: $95.00
November: $75.00
...
```

---

## 📝 User Flow 6: Editing Maintenance Records

### Step 1: Navigate to Edit
From Maintenance Logs table:
- Click "Edit" icon on any record
- Opens: `/maintenance/[maintenanceId]/edit`

### Step 2: Edit Form (Pre-populated)

```
┌────────────────────────────────────────┐
│ Edit Maintenance Record                │
├────────────────────────────────────────┤
│ Service Category: [Oil Change ▼]       │
│ Service Date: [Jan 10, 2026]          │
│ Mileage: [45000] km                    │
│ Cost: [$65.00]                         │
│ Service Provider: [Honda Dealership]   │
│ Notes: [Full synthetic 5W-30...]      │
│ Receipt: [current-receipt.pdf]        │
│          [Upload New]                  │
├────────────────────────────────────────┤
│ Next Service (Calculated):             │
│ ├─ Date: July 10, 2026                │
│ └─ Mileage: 53,000 km                 │
├────────────────────────────────────────┤
│ [Cancel] [Delete Record] [Save Changes]│
└────────────────────────────────────────┘
```

### Step 3: Make Changes
User can edit:
- Service date
- Mileage reading
- Cost
- Notes
- Service provider
- Upload new receipt

**What happens when editing:**
- Next due date/mileage recalculated automatically
- Associated reminder updated
- Vehicle mileage updated if changed
- Priority recalculated

### Step 4: Save
- Click "Save Changes"
- System validates all fields
- Updates record and reminder
- Revalidates related pages
- Shows success: "Maintenance record updated"

---

## 🔄 User Flow 7: Template System (Behind the Scenes)

### How Templates Work:

#### 1. Vehicle Added → Template Selected
```javascript
// User adds: 2020 Honda Civic
classifyVehicle("Honda", "Civic", 2020)
→ { type: 'sedan', powertrain: 'gasoline', ageGroup: 'mid-life' }

getVehicleMaintenanceTemplate(vehicleId)
→ Checks:
   1. Is it Honda? Apply Honda-specific adjustments
   2. Is it gasoline? Include oil change, exclude EV items
   3. Is it mid-life? Adjust inspection frequency
   4. Is it sedan? Use standard template
```

#### 2. Template Structure
```javascript
{
  vehicleId: "...",
  vehicleInfo: {
    make: "Honda",
    model: "Civic",
    year: 2020,
    type: "sedan",
    powertrain: "gasoline",
    ageGroup: "mid-life"
  },
  maintenanceSchedule: [
    {
      category: "oil-change",
      name: "Oil Change",
      description: "Replace engine oil and filter",
      intervals: {
        time: { value: 6, unit: "months" },
        mileage: { value: 8000, unit: "km" }
      },
      priority: "high",
      estimatedCost: { min: 60, max: 80 },
      applicableConditions: ["gasoline", "hybrid"]
    },
    // ... 19 more categories
  ],
  adjustments: {
    manufacturer: "Honda-specific intervals applied",
    ageGroup: "Increased inspection frequency for 4-7 year old vehicle"
  }
}
```

#### 3. Different Vehicle Types Get Different Templates

**Gasoline Sedan (Standard):**
- Oil change every 6mo/8,000km
- 19 total maintenance items

**Electric Vehicle:**
- NO oil change
- NO transmission service
- NO exhaust inspection
- ADDS EV battery health check
- ADDS electric motor inspection
- 14 total maintenance items

**Hybrid Vehicle:**
- Oil change every 9mo/12,000km (longer interval)
- ADDS hybrid battery check
- ADDS regenerative brake system check
- 20 total maintenance items

**Pickup Truck:**
- Differential service every 30,000km
- More frequent suspension checks
- Heavy-duty brake inspections
- 20 total maintenance items

---

## 🎯 User Flow 8: Driving Conditions (Advanced)

### Future Enhancement - Not Yet Implemented

User could specify driving conditions to adjust intervals:

```
Vehicle Settings:
├─ Driving Conditions:
│  ├─ □ City Traffic (frequent stops)
│  ├─ □ Highway Driving (high speed)
│  ├─ □ Rough Roads (potholes, gravel)
│  ├─ □ Hot Climate (>35°C regularly)
│  ├─ □ Cold Climate (<-15°C regularly)
│  ├─ □ Dusty Environment
│  └─ □ Towing/Heavy Loads
```

**How it would adjust:**
```javascript
// Standard: Oil change every 6 months
// With "City Traffic" + "Hot Climate":
adjustInterval(6, ['city-traffic', 'hot-climate'])
→ 4.5 months (25% reduction)

// Standard: Tire rotation every 10,000 km
// With "Rough Roads":
adjustInterval(10000, ['rough-roads'])
→ 8,000 km (20% reduction)
```

---

## 📱 User Flow 9: Mobile Responsiveness

All pages are fully responsive:

### Mobile View Features:
```
[☰ Menu]  AutoCare+  [👤 Profile]

┌─────────────────────┐
│ Honda Civic 2020    │
│ ABC123              │
│ ──────────────────  │
│ Next: Oil Change    │
│ Due: Jan 28         │
│ ──────────────────  │
│ [View] [Log Service]│
└─────────────────────┘

⚠️ 2 Reminders Overdue
○ 5 Upcoming

[View All Reminders →]
```

### Mobile Optimizations:
- Hamburger menu for navigation
- Swipeable cards
- Bottom action sheets
- Touch-friendly buttons (44px minimum)
- Simplified tables (stack on mobile)
- Responsive forms (full-width inputs)

---

## 🔍 User Flow 10: Search & Filter

### Vehicle Search:
```
Search vehicles...
├─ By make: "Honda"
├─ By model: "Civic"
├─ By plate: "ABC"
└─ By year: "2020"
```

### Maintenance Log Filters:
```
[Filter by Category ▼]
├─ All Categories
├─ Oil Change (5)
├─ Tire Services (3)
├─ Brake Work (2)
└─ Other (10)

[Filter by Date Range ▼]
├─ Last 30 Days
├─ Last 3 Months
├─ Last 6 Months
├─ This Year
└─ Custom Range

[Sort by ▼]
├─ Date (Newest First)
├─ Date (Oldest First)
├─ Cost (High to Low)
└─ Cost (Low to High)
```

### Reminder Filters:
```
[All Vehicles ▼]
├─ All Vehicles
├─ Honda Civic (8 reminders)
└─ Toyota Camry (6 reminders)

[Status ▼]
├─ All (14)
├─ Overdue (2)
├─ Due Soon (5)
└─ Upcoming (7)

[Priority ▼]
├─ All
├─ High (6)
├─ Medium (5)
└─ Low (3)
```

---

## 💡 Key Features Summary

### ✅ Automatic Features:
1. **Vehicle Classification** - Detects type, powertrain, age
2. **Template Selection** - Chooses appropriate schedule
3. **Reminder Generation** - Creates all maintenance reminders
4. **Next Due Calculation** - Auto-calculates dates/mileage
5. **Priority Assignment** - High/Medium/Low based on intervals
6. **Mileage Updates** - Syncs vehicle odometer automatically
7. **Manufacturer Adjustments** - Brand-specific intervals

### ✅ User Controls:
1. **Manual Service Logging** - User enters when maintenance done
2. **Custom Notes** - Add context to each service
3. **Cost Tracking** - Optional expense recording
4. **Receipt Upload** - Store proof of service
5. **Snooze Reminders** - Delay non-urgent services
6. **Edit History** - Modify past records
7. **Delete Records** - Remove incorrect entries

### ✅ Intelligence:
1. **Dual Triggers** - Time OR mileage, whichever comes first
2. **Overdue Detection** - Flags past-due services
3. **Cost Analytics** - Spending patterns and averages
4. **Service History** - Complete maintenance timeline
5. **Template Library** - 20 maintenance categories
6. **Multi-vehicle** - Manage fleet of vehicles
7. **Data Validation** - Prevents invalid entries

---

## 🧪 Validation Test Scenarios

### Test 1: New Vehicle Flow
1. ✅ Add Honda Civic 2020
2. ✅ Verify 19 reminders created
3. ✅ Check oil change due in 6 months
4. ✅ Verify tire rotation due in 10,000 km
5. ✅ Confirm vehicle appears in dashboard

### Test 2: Electric Vehicle Flow
1. ✅ Add Tesla Model 3 2022
2. ✅ Verify NO oil change reminder
3. ✅ Verify EV battery check reminder exists
4. ✅ Check only 14 reminders created (not 19)
5. ✅ Confirm powertrain = "electric"

### Test 3: Log Maintenance Flow
1. ✅ Log oil change for Honda Civic
2. ✅ Verify new reminder created for next oil change
3. ✅ Check next due date = +6 months
4. ✅ Verify vehicle mileage updated
5. ✅ Confirm old reminder marked complete

### Test 4: Overdue Detection
1. ✅ Set reminder due date to past
2. ✅ Check reminder shows "OVERDUE"
3. ✅ Verify appears in overdue section
4. ✅ Confirm priority increases to high
5. ✅ Check dashboard shows overdue count

### Test 5: Cost Tracking
1. ✅ Log 5 services with costs
2. ✅ Check total cost calculated correctly
3. ✅ Verify average cost per service
4. ✅ Confirm cost breakdown by category
5. ✅ Check monthly spending chart

### Test 6: Multi-Vehicle Management
1. ✅ Add 3 different vehicles
2. ✅ Verify each has separate reminders
3. ✅ Check dashboard shows all vehicles
4. ✅ Confirm filtering by vehicle works
5. ✅ Test switching between vehicles

### Test 7: Edit & Delete
1. ✅ Edit maintenance record
2. ✅ Verify next due date recalculated
3. ✅ Delete maintenance record
4. ✅ Confirm reminder removed
5. ✅ Check history updated

### Test 8: Mobile Responsiveness
1. ✅ Test on phone (375px width)
2. ✅ Verify all buttons tappable
3. ✅ Check forms usable
4. ✅ Confirm tables adapt
5. ✅ Test navigation menu

---

## 📋 Feature Checklist for Validation

### Core Features:
- [✅] Add vehicle with classification
- [✅] Auto-generate maintenance reminders
- [✅] Log maintenance services
- [✅] Calculate next due dates
- [✅] Update vehicle mileage automatically
- [✅] View maintenance history
- [✅] Edit past maintenance records
- [✅] Delete maintenance records
- [✅] Complete reminders
- [✅] Snooze reminders
- [✅] View reminder details
- [✅] Filter by vehicle/category/status
- [✅] Sort maintenance logs
- [✅] Track expenses
- [✅] Upload receipts
- [✅] Dashboard metrics
- [✅] Activity feed
- [✅] Multi-vehicle support

### Vehicle Types Supported:
- [✅] Gasoline Sedan
- [✅] Gasoline SUV
- [✅] Diesel Pickup
- [✅] Hybrid Sedan
- [✅] Electric Vehicle
- [✅] Hatchback
- [✅] Van

### Maintenance Categories:
- [✅] Oil Change
- [✅] Tire Rotation
- [✅] Brake Inspection
- [✅] Battery Check
- [✅] Air Filter
- [✅] Cabin Filter
- [✅] Coolant Flush
- [✅] Transmission Service
- [✅] Spark Plugs
- [✅] Timing Belt/Chain
- [✅] Brake Fluid
- [✅] Power Steering
- [✅] Differential Service
- [✅] Wheel Alignment
- [✅] Suspension Check
- [✅] Exhaust Inspection
- [✅] Wiper Blades
- [✅] Light Bulbs
- [✅] Safety Inspection
- [✅] Annual Inspection

---

**Document Created:** January 15, 2026  
**AutoCare+ Maintenance System v1.0**

Use this comprehensive user flow document to validate all features and ensure the maintenance tracking system works as expected! 🚗✨
