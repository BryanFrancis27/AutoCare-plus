'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

// ===========================
// TypeScript Interfaces
// ===========================

export interface DashboardMetrics {
  totalVehicles: number;
  maintenanceRecords: number;
  activeReminders: number;
  monthlyExpenses: number;
  upcomingServices: number;
  overdueItems: number;
}

export interface ActivityItem {
  id: string;
  type: 'maintenance' | 'reminder' | 'expense' | 'vehicle_added';
  description: string;
  timestamp: Date;
  vehicleName?: string;
  vehicleId?: string;
  metadata?: Record<string, any>;
}

export interface ReminderItem {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  vehicleName?: string;
  vehicleId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// ===========================
// Dashboard Metrics
// ===========================

export async function fetchDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const supabase = createSupabaseServerClient();

  try {
    // Fetch total vehicles
    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Fetch total maintenance records - use maintenance_logs table
    const { count: maintenanceRecords } = await supabase
      .from('maintenance_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Fetch active reminders (not completed)
    const { count: activeReminders } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false);

    // Fetch monthly expenses (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startOfMonth.toISOString());

    const monthlyExpenses = expenseData?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

    // Fetch upcoming services (next 30 days) from reminders
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const { count: upcomingServices } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gte('due_date', today.toISOString())
      .lte('due_date', next30Days.toISOString());

    // Fetch overdue items
    const { count: overdueItems } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lt('due_date', today.toISOString());

    return {
      totalVehicles: totalVehicles || 0,
      maintenanceRecords: maintenanceRecords || 0,
      activeReminders: activeReminders || 0,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      upcomingServices: upcomingServices || 0,
      overdueItems: overdueItems || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Return default values on error
    return {
      totalVehicles: 0,
      maintenanceRecords: 0,
      activeReminders: 0,
      monthlyExpenses: 0,
      upcomingServices: 0,
      overdueItems: 0,
    };
  }
}

// ===========================
// Recent Activities
// ===========================

export async function fetchRecentActivities(
  userId: string,
  limit: number = 5
): Promise<ActivityItem[]> {
  const supabase = createSupabaseServerClient();

  try {
    // Fetch recent maintenance records from maintenance_logs table
    const { data: maintenanceData } = await supabase
      .from('maintenance_logs')
      .select(`
        id,
        service_type,
        service_date,
        vehicle_id,
        vehicles (
          make,
          model,
          year
        )
      `)
      .eq('user_id', userId)
      .order('service_date', { ascending: false })
      .limit(limit);

    // Fetch recently added vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, make, model, year, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Fetch recent expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        amount,
        date,
        vehicle_id,
        vehicles (
          make,
          model,
          year
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    // Fetch recent reminders (created or updated)
    const { data: remindersData } = await supabase
      .from('reminders')
      .select(`
        id,
        title,
        due_date,
        created_at,
        vehicle_id,
        vehicles (
          make,
          model,
          year
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Combine and format all activities
    const activities: ActivityItem[] = [];

    // Add maintenance activities
    maintenanceData?.forEach((record: any) => {
      const vehicle = record.vehicles;
      activities.push({
        id: `maintenance-${record.id}`,
        type: 'maintenance',
        description: `${record.service_type} completed`,
        timestamp: new Date(record.service_date),
        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
        vehicleId: record.vehicle_id,
        metadata: { serviceType: record.service_type },
      });
    });

    // Add vehicle additions
    vehiclesData?.forEach((vehicle: any) => {
      activities.push({
        id: `vehicle-${vehicle.id}`,
        type: 'vehicle_added',
        description: 'New vehicle added',
        timestamp: new Date(vehicle.created_at),
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        vehicleId: vehicle.id,
      });
    });

    // Add expense activities
    expensesData?.forEach((expense: any) => {
      const vehicle = expense.vehicles;
      activities.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        description: `${expense.description} - $${expense.amount}`,
        timestamp: new Date(expense.date),
        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
        vehicleId: expense.vehicle_id,
        metadata: { amount: expense.amount },
      });
    });

    // Add reminder activities
    remindersData?.forEach((reminder: any) => {
      const vehicle = reminder.vehicles;
      activities.push({
        id: `reminder-${reminder.id}`,
        type: 'reminder',
        description: `Reminder set: ${reminder.title}`,
        timestamp: new Date(reminder.created_at),
        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
        vehicleId: reminder.vehicle_id,
      });
    });

    // Sort by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

// ===========================
// Upcoming Reminders
// ===========================

export async function fetchUpcomingReminders(
  userId: string,
  days: number = 30
): Promise<ReminderItem[]> {
  const supabase = createSupabaseServerClient();

  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const { data: remindersData } = await supabase
      .from('reminders')
      .select(`
        id,
        title,
        description,
        due_date,
        status,
        vehicle_id,
        vehicles (
          make,
          model,
          year
        )
      `)
      .eq('user_id', userId)
      .in('status', ['pending', 'overdue'])
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true });

    if (!remindersData) return [];

    return remindersData.map((reminder: any) => {
      const vehicle = reminder.vehicles;
      const dueDate = new Date(reminder.due_date);
      const isOverdue = dueDate < today;

      return {
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        dueDate,
        status: isOverdue ? 'overdue' : reminder.status,
        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
        vehicleId: reminder.vehicle_id,
        priority: isOverdue ? 'high' : dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'medium' : 'low',
      };
    });
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    return [];
  }
}
