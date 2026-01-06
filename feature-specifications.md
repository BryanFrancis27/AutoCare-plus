# AutoCare+  
## Feature Specifications and Page Definitions

---

## 1. Project Overview

**AutoCare+** is a web-based vehicle maintenance and service tracking system designed for individual car owners. The system provides a centralized platform for managing vehicle information, logging maintenance activities, tracking expenses, and receiving service reminders. It aims to improve organization, accessibility, and proactive vehicle care using modern web technologies.

---

## 2. User Roles

### 2.1 Vehicle Owner (Primary User)
- Register and authenticate into the system
- Manage personal vehicles
- Log maintenance and service activities
- Track maintenance expenses
- Receive service reminders
- View dashboard summaries

> Note: The system is designed for single-role usage in the initial version.

---

## 3. Feature Specifications

### 3.1 User Authentication
**Description:**  
Allows users to securely register, log in, and manage their sessions.

**Functional Specifications:**
- User registration using email and password
- User login and logout
- Session management
- Protected routes (authenticated access only)

**Technology:**
- Supabase Authentication

---

### 3.2 Vehicle Management
**Description:**  
Allows users to register and manage one or more vehicles.

**Functional Specifications:**
- Add vehicle details:
  - Make
  - Model
  - Year
  - Plate number
- Edit vehicle information
- Delete vehicle records
- Associate vehicles with the logged-in user

---

### 3.3 Maintenance and Service Logging
**Description:**  
Allows users to record maintenance and repair activities for each vehicle.

**Functional Specifications:**
- Log maintenance records with:
  - Service type
  - Service date
  - Mileage
  - Cost
  - Notes (optional)
- View complete maintenance history per vehicle
- Edit and delete maintenance records

---

### 3.4 Service Reminders
**Description:**  
Notifies users of upcoming vehicle maintenance schedules.

**Functional Specifications:**
- Create maintenance reminders based on:
  - Date
  - Mileage
- View upcoming and overdue reminders
- Display reminder alerts on the dashboard
- Optional email notifications

---

### 3.5 Expense Tracking
**Description:**  
Tracks vehicle-related maintenance expenses.

**Functional Specifications:**
- Record expenses linked to maintenance logs
- Categorize expenses (e.g., oil change, repair, inspection)
- View total expenses per vehicle
- View expense summaries over time

---

### 3.6 Dashboard Overview
**Description:**  
Provides a summarized view of vehicle status and activities.

**Functional Specifications:**
- Display registered vehicles
- Show recent maintenance activities
- Highlight upcoming service reminders
- Show total maintenance expenses
- Provide quick navigation to key features

---

### 3.7 File Upload (Optional Enhancement)
**Description:**  
Allows users to upload service receipts or images.

**Functional Specifications:**
- Upload images or PDF receipts
- Link files to specific maintenance records
- Store files securely

**Technology:**
- Supabase Storage

---

## 4. Application Pages

### 4.1 Authentication Pages
- **Login Page**
  - Email and password input
  - Login button
- **Registration Page**
  - Email, password, confirm password
  - Account creation

---

### 4.2 Dashboard Page
**Purpose:**  
Central hub of the system.

**Components:**
- Vehicle summary cards
- Upcoming maintenance reminders
- Recent maintenance logs
- Expense summary

---

### 4.3 Vehicle Management Page
**Purpose:**  
Manage vehicle information.

**Components:**
- List of registered vehicles
- Add vehicle form
- Edit and delete vehicle options

---

### 4.4 Maintenance Log Page
**Purpose:**  
Manage maintenance records.

**Components:**
- Maintenance log list per vehicle
- Add maintenance record form
- Edit and delete maintenance entries

---

### 4.5 Reminders Page
**Purpose:**  
View and manage service reminders.

**Components:**
- Upcoming reminders list
- Overdue maintenance indicators
- Reminder details

---

### 4.6 Expense Tracking Page
**Purpose:**  
View and analyze maintenance expenses.

**Components:**
- Expense list
- Total expense summary
- Filter by vehicle or date

---

### 4.7 Profile / Settings Page
**Purpose:**  
Manage user account settings.

**Components:**
- User information
- Logout option

---

## 5. Non-Functional Specifications

- **Security:** User data is protected using authentication and row-level security.
- **Usability:** Simple and intuitive UI for non-technical users.
- **Performance:** Optimized queries and fast page loads.
- **Scalability:** Designed to support multiple users and vehicles.
- **Accessibility:** Responsive design for desktop and mobile browsers.

---

## 6. Out-of-Scope Features

The following features are not included in the initial version:
- OBD or real-time vehicle data integration
- Predictive maintenance using AI
- Payment or insurance integration
- Native mobile application
- Multi-role access (mechanics or service centers)

---

## 7. Future Enhancements

- Mobile application version
- Advanced analytics and reports
- Exportable maintenance history (PDF/CSV)
- Integration with service providers
- Push notifications

---

**End of Document**
