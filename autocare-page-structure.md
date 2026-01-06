AutoCare+ – Application Pages Structure
1. Public Pages (Unauthenticated Access)

These pages are accessible without logging in.

1.1 Landing Page

Purpose:
Introduces AutoCare+ and explains its purpose.

Content:

Project name and tagline

Brief system description

Key features overview

Call-to-action (Login / Register)

1.2 Login Page

Purpose:
Allows registered users to access the system.

Components:

Email input

Password input

Login button

Link to Registration Page

1.3 Registration Page

Purpose:
Allows new users to create an account.

Components:

Email input

Password input

Confirm password

Register button

Link to Login Page

2. Protected Pages (Authenticated Access Only)

These pages require the user to be logged in.

2.1 Dashboard

Route: /dashboard
Purpose:
Central overview of the system.

Components:

Vehicle summary cards

Recent maintenance activities

Upcoming service reminders

Expense summary

Quick navigation links

2.2 Vehicle Management
2.2.1 Vehicles List Page

Route: /vehicles
Purpose:
Displays all vehicles registered by the user.

Components:

List/table of vehicles

Add Vehicle button

Edit/Delete vehicle actions

2.2.2 Add Vehicle Page

Route: /vehicles/add
Purpose:
Register a new vehicle.

Components:

Make

Model

Year

Plate number

Save button

2.2.3 Edit Vehicle Page

Route: /vehicles/[vehicleId]/edit
Purpose:
Modify existing vehicle details.

Components:

Pre-filled vehicle form

Update button

Cancel option

2.2.4 Vehicle Details Page

Route: /vehicles/[vehicleId]
Purpose:
View detailed information for a specific vehicle.

Components:

Vehicle info

Maintenance summary

Expense summary

Quick links to logs and reminders

2.3 Maintenance Management
2.3.1 Maintenance Logs Page

Route: /vehicles/[vehicleId]/maintenance
Purpose:
View all maintenance records for a vehicle.

Components:

Maintenance history list

Add Maintenance button

Edit/Delete actions

2.3.2 Add Maintenance Record Page

Route: /vehicles/[vehicleId]/maintenance/add
Purpose:
Add a new maintenance/service record.

Components:

Service type

Service date

Mileage

Cost

Notes

Save button

2.3.3 Edit Maintenance Record Page

Route: /maintenance/[maintenanceId]/edit
Purpose:
Modify an existing maintenance record.

Components:

Editable maintenance form

Update button

2.4 Service Reminders
2.4.1 Reminders List Page

Route: /reminders
Purpose:
View all service reminders.

Components:

Upcoming reminders

Overdue reminders

Linked vehicle info

2.4.2 Add Reminder Page

Route: /vehicles/[vehicleId]/reminders/add
Purpose:
Create a new service reminder.

Components:

Reminder type

Due date and/or mileage

Save button

2.4.3 Reminder Details Page

Route: /reminders/[reminderId]
Purpose:
View reminder details.

Components:

Reminder info

Vehicle info

Mark as completed option

2.5 Expense Tracking
2.5.1 Expenses Overview Page

Route: /expenses
Purpose:
View all maintenance-related expenses.

Components:

Expense list

Total expenses

Filter by vehicle/date

2.5.2 Expense Details Page

Route: /expenses/[expenseId]
Purpose:
View detailed expense information.

Components:

Expense amount

Category

Linked maintenance record

Date

2.6 Profile and Settings
2.6.1 Profile Page

Route: /profile
Purpose:
Manage user account settings.

Components:

User email

Account information

Logout button

3. Optional / Enhancement Pages (If Time Allows)

These are not required but may be implemented if time permits.

3.1 Receipt Upload Page

Route: /maintenance/[maintenanceId]/upload

Upload service receipts or images

3.2 Reports Page

Route: /reports

Maintenance and expense summaries

Export (PDF/CSV)

4. Error and Utility Pages
4.1 404 Page

Purpose:
Handle invalid routes.

4.2 Unauthorized Access Page

Purpose:
Displayed when users attempt to access restricted content.

5. Minimum Required Pages (For Proposal Approval)

To pass proposal evaluation, the following pages are considered mandatory:

Login / Register

Dashboard

Vehicles List

Add/Edit Vehicle

Maintenance Logs

Add Maintenance

Reminders

Expenses Overview

Profile