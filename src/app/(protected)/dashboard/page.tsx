'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Wrench, Bell, DollarSign, Plus, Calendar } from 'lucide-react';
import { MetricCard, ActivityFeed, QuickActionButton, UpcomingReminders } from '@/components/dashboard';
import { 
  DashboardMetrics,
  ActivityItem,
  ReminderItem
} from '@/app/actions/dashboard-metrics';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);

  // Fetch all data when component mounts
  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      try {
        // Fetch metrics
        const [vehiclesCount, maintenanceCount, remindersCount, expensesData] = await Promise.all([
          supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('maintenance_records').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['pending', 'overdue']),
          supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        const monthlyExpenses = expensesData.data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

        setMetrics({
          totalVehicles: vehiclesCount.count || 0,
          maintenanceRecords: maintenanceCount.count || 0,
          activeReminders: remindersCount.count || 0,
          monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
          upcomingServices: 0,
          overdueItems: 0,
        });
        setLoadingMetrics(false);

        // Fetch activities
        const [maintenanceData, vehiclesData, expensesActivityData] = await Promise.all([
          supabase.from('maintenance_records').select('id, service_type, date, vehicle_id, vehicles(make, model, year)').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
          supabase.from('vehicles').select('id, make, model, year, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('expenses').select('id, description, amount, date, vehicle_id, vehicles(make, model, year)').eq('user_id', user.id).order('date', { ascending: false }).limit(5)
        ]);

        const combinedActivities: ActivityItem[] = [];

        maintenanceData.data?.forEach((record: any) => {
          const vehicle = record.vehicles;
          combinedActivities.push({
            id: `maintenance-${record.id}`,
            type: 'maintenance',
            description: `${record.service_type} completed`,
            timestamp: new Date(record.date),
            vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
            vehicleId: record.vehicle_id,
          });
        });

        vehiclesData.data?.forEach((vehicle: any) => {
          combinedActivities.push({
            id: `vehicle-${vehicle.id}`,
            type: 'vehicle_added',
            description: 'New vehicle added',
            timestamp: new Date(vehicle.created_at),
            vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicleId: vehicle.id,
          });
        });

        expensesActivityData.data?.forEach((expense: any) => {
          const vehicle = expense.vehicles;
          combinedActivities.push({
            id: `expense-${expense.id}`,
            type: 'expense',
            description: `${expense.description} - $${expense.amount}`,
            timestamp: new Date(expense.date),
            vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
            vehicleId: expense.vehicle_id,
          });
        });

        setActivities(combinedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5));
        setLoadingActivities(false);

        // Fetch reminders
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const remindersData = await supabase
          .from('reminders')
          .select('id, title, description, due_date, status, vehicle_id, vehicles(make, model, year)')
          .eq('user_id', user.id)
          .in('status', ['pending', 'overdue'])
          .lte('due_date', futureDate.toISOString())
          .order('due_date', { ascending: true });

        const formattedReminders: ReminderItem[] = remindersData.data?.map((reminder: any) => {
          const vehicle = reminder.vehicles;
          const dueDate = new Date(reminder.due_date);
          const isOverdue = dueDate < new Date();

          return {
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            dueDate,
            status: isOverdue ? 'overdue' : reminder.status,
            vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
            vehicleId: reminder.vehicle_id,
            priority: isOverdue ? 'high' : 'medium',
          };
        }) || [];

        setReminders(formattedReminders);
        setLoadingReminders(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoadingMetrics(false);
        setLoadingActivities(false);
        setLoadingReminders(false);
      }
    }

    loadDashboardData();
  }, []);

  // Quick actions configuration
  const quickActions = [
    {
      id: 'add_vehicle',
      label: 'Add Vehicle',
      icon: Plus,
      href: '/vehicles',
      color: 'bg-redPrimary'
    },
    {
      id: 'log_maintenance',
      label: 'Log Maintenance',
      icon: Wrench,
      href: '/vehicles',
      color: 'bg-redPrimary'
    },
    {
      id: 'add_reminder',
      label: 'Set Reminder',
      icon: Bell,
      href: '/reminders',
      color: 'bg-redPrimary'
    },
    {
      id: 'view_expenses',
      label: 'View Expenses',
      icon: DollarSign,
      href: '/expenses',
      color: 'bg-redPrimary'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-whitePure">Dashboard</h1>
        <p className="text-textSecondary mt-1">
          Overview of your vehicles, recent activity, and reminders.
        </p>
      </div>

      {/* Metric Cards */}
      <DashboardErrorBoundary>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <MetricCard
              label="Total Vehicles"
              value={metrics?.totalVehicles ?? 0}
              icon={Car}
              iconBgColor="bg-redPrimary"
              loading={loadingMetrics}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MetricCard
              label="Maintenance Records"
              value={metrics?.maintenanceRecords ?? 0}
              icon={Wrench}
              iconBgColor="bg-redPrimary"
              loading={loadingMetrics}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MetricCard
              label="Active Reminders"
              value={metrics?.activeReminders ?? 0}
              icon={Bell}
              iconBgColor="bg-redPrimary"
              loading={loadingMetrics}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MetricCard
              label="Monthly Expenses"
              value={`$${metrics?.monthlyExpenses?.toFixed(2) ?? '0.00'}`}
              icon={DollarSign}
              iconBgColor="bg-redPrimary"
              loading={loadingMetrics}
            />
          </motion.div>
        </div>
      </DashboardErrorBoundary>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-6"
      >
        <h3 className="text-lg font-semibold text-whitePure mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.id}
              label={action.label}
              icon={action.icon}
              href={action.href}
              iconBgColor={action.color}
            />
          ))}
        </div>
      </motion.div>

      {/* Activity Feed and Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardErrorBoundary>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ActivityFeed 
              activities={activities} 
              loading={loadingActivities}
              maxItems={5}
            />
          </motion.div>
        </DashboardErrorBoundary>

        <DashboardErrorBoundary>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <UpcomingReminders 
              reminders={reminders} 
              loading={loadingReminders}
            />
          </motion.div>
        </DashboardErrorBoundary>
      </div>
    </div>
  );
}
