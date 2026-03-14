# AutoCare+ Maintenance Data Strategy

## Purpose of This Document

This document defines the **official maintenance data strategy** for the AutoCare+ project.

It serves as a **source of truth** for:
- GitHub Copilot
- Future contributors
- Project evaluators

All maintenance-related logic MUST follow the rules outlined here.

---

## Core Decision Summary

AutoCare+ uses a **static, template-based maintenance data approach** for its initial implementation.

🔒 **No external APIs are used at this stage.**  
🔁 The system is intentionally designed to allow **future migration to API-based data sources** without major architectural changes.

Static data is treated as **reference guidance**, not real-time diagnostics.

---

## Rationale for Static Data (Initial Phase)

The use of static data is intentional and justified by the following:

- Ensures feasibility within a limited development timeline
- Avoids dependency on paid or restricted third-party APIs
- Prevents incorrect diagnostics or unsafe assumptions
- Keeps the system understandable for non-technical users
- Aligns with academic capstone project scope

---

## Maintenance Data Source (Current Implementation)

### 1. Static Reference Maintenance Data

Maintenance schedules are based on **widely accepted automotive maintenance best practices**, including:

- Oil change: every 6 months or 5,000–10,000 km
- Tire rotation: every 10,000 km
- Brake inspection: once per year
- Battery check: every 1–2 years
- General safety inspection: annually

These values are:
- Curated manually
- Manufacturer-agnostic by default
- Intended for **general vehicle care guidance only**

❗ AutoCare+ MUST NOT claim OEM-specific or manufacturer-certified accuracy.

---

## Vehicle Classification (Static)

The system supports predefined vehicle classifications used to apply maintenance templates.

### Vehicle Types
- Sedan
- Hatchback
- SUV
- Pickup Truck
- Van
- Hybrid
- Electric Vehicle (EV)

### Vehicle Age Groups
- **0–3 years** (New)
- **4–7 years** (Mid-life)
- **8+ years** (Aging)

Age groups are used to **adjust inspection frequency**, not to diagnose failures.

---

## Maintenance Categories

The system must define predefined maintenance categories, including but not limited to:

- Oil Change
- Tire Rotation
- Brake Inspection
- Battery Check
- General Inspection
- Fluid Inspection
- Filter Replacement
- Safety Check

Each category MUST include:
- `name`
- `description` (plain language)
- `default_time_interval` (months)
- `default_mileage_interval` (optional)

---

## Static Maintenance Reference Data

### General Maintenance (All Vehicles)

| Maintenance Item        | Time Interval | Mileage Interval | Priority |
|------------------------|---------------|------------------|----------|
| Engine Oil & Filter    | 6 months      | 5,000–10,000 km  | High     |
| Tire Rotation          | —             | 10,000 km        | Medium   |
| Brake Inspection       | 12 months     | —                | High     |
| Air Filter Replacement | 12 months     | 20,000 km        | Medium   |
| Cabin Filter           | 12 months     | 15,000 km        | Low      |
| Fluid Level Check      | —             | 5,000 km         | High     |
| General Inspection     | 12 months     | —                | High     |

---

## Vehicle-Type Adjustments (Static Rules)

### Sedan / Hatchback
- Brake pads: inspect every 40,000–60,000 km
- Spark plugs: 60,000–100,000 km
- Wheel alignment: every 20,000 km

### SUV / Pickup Truck
- Suspension inspection every 20,000 km
- Differential fluid (if applicable): 40,000–60,000 km
- Brake inspections may be more frequent due to vehicle weight

---

## Powertrain-Specific Maintenance

### Gasoline Vehicles
- Fuel system inspection: every 40,000 km
- Exhaust system check: annually

### Hybrid Vehicles
- Hybrid battery health check: annually
- Brake inspection every 30,000 km (regenerative braking)

### Electric Vehicles (EV)
- Battery cooling system check: annually
- Brake inspection every 20,000 km
- Software update check during service visits

❗ EV maintenance recommendations MUST remain **informational**, not diagnostic.

---

## Manufacturer & Model Reference (Non-OEM)

AutoCare+ MAY use **light manufacturer-based differentiation** for realism, but MUST remain non-OEM.

### Toyota (2015–2024)
- Corolla: CVT fluid inspection every 60,000 km
- Camry: frequent brake inspections
- Hilux: drivetrain fluid checks for heavy use
- RAV4: AWD system inspection if applicable

### Honda (2015–2024)
- Civic: CVT fluid check every 40,000–60,000 km
- CR-V: suspension & alignment emphasis
- City: urban brake wear monitoring

### Ford (2014–2023)
- Ranger: transmission fluid inspection every 50,000 km
- Everest: cooling system inspection
- EcoSport: turbo system inspection

❗ These references are **guidance only**, not official service schedules.

---

## Maintenance Templates

### Template Behavior

- Each vehicle is assigned a default maintenance template
- Templates automatically apply predefined schedules
- Users may enable, disable, or adjust services
- Templates must function even if mileage is unknown

Templates MUST:
- Use simple rule-based logic
- Avoid technical terminology
- Require minimal user input

---

## Driving Condition Modifiers (Optional)

| Condition            | Adjustment Rule |
|---------------------|-----------------|
| Heavy city traffic   | Shorten oil interval by ~20% |
| Long highway driving | Slightly extend oil interval |
| Rough roads          | Increase suspension inspections |
| Hot climate          | More frequent cooling checks |

Modifiers adjust **reminder frequency only**, not maintenance type.

---

## Reminder Logic

Reminders must be:
- Rule-based
- Deterministic
- Transparent

Example:
```text
next_due_date = last_service_date + interval
