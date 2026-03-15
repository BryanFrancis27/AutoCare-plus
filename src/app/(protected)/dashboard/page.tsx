'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Car, Wrench, Bell, PhilippinePeso, Plus } from 'lucide-react';
import {
  MetricCard,
  ActivityFeed,
  WrenchAnimation,
  ServiceExpensesModal,
} from '@/components/dashboard';
import { LogMaintenanceModal } from '@/components/maintenance/LogMaintenanceModal';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { ActivityItem } from '@/app/actions/dashboard-metrics';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';
import { formatCurrencyPHP } from '@/lib/currency';
import { useRouter } from 'next/navigation';

interface DashboardMetrics {
  totalVehicles: number;
  maintenanceRecords: number;
  activeReminders: number;
  monthlyExpenses: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [logMaintenanceOpen, setLogMaintenanceOpen] = useState(false);
  const [serviceExpensesOpen, setServiceExpensesOpen] = useState(false);

  const refreshData = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      setLoadingMetrics(true);
      setLoadingActivities(true);

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // ----- Metrics -----
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [vehiclesRes, maintenanceRes, remindersRes, expensesRes] = await Promise.all([
          supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('maintenance_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('reminders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_completed', false),
          supabase
            .from('maintenance_logs')
            .select('cost')
            .eq('user_id', user.id)
            .gte('service_date', startOfMonth.toISOString().split('T')[0]),
        ]);

        const monthlyExpenses =
          expensesRes.data?.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) ?? 0;

        setMetrics({
          totalVehicles: vehiclesRes.count ?? 0,
          maintenanceRecords: maintenanceRes.count ?? 0,
          activeReminders: remindersRes.count ?? 0,
          monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
        });
        setLoadingMetrics(false);

        // ----- Activities -----
        const [maintenanceData, vehiclesData] = await Promise.all([
          supabase
            .from('maintenance_logs')
            .select('id, service_type, service_date, vehicle_id, vehicles(make, model, year)')
            .eq('user_id', user.id)
            .order('service_date', { ascending: false })
            .limit(10),
          supabase
            .from('vehicles')
            .select('id, make, model, year, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        const combined: ActivityItem[] = [];

        maintenanceData.data?.forEach((record: any) => {
          const vehicle = record.vehicles;
          const vehicleName = vehicle
            ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
            : undefined;
          combined.push({
            id: `maintenance-${record.id}`,
            type: 'maintenance',
            description: vehicleName
              ? `Maintenance logged for ${vehicle.make} ${vehicle.model}`
              : `${record.service_type} logged`,
            timestamp: new Date(record.service_date),
            vehicleName,
            vehicleId: record.vehicle_id,
          });
        });

        vehiclesData.data?.forEach((vehicle: any) => {
          combined.push({
            id: `vehicle-${vehicle.id}`,
            type: 'vehicle_added',
            description: `Vehicle added to garage`,
            timestamp: new Date(vehicle.created_at),
            vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicleId: vehicle.id,
          });
        });

        setActivities(
          combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 3)
        );
        setLoadingActivities(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoadingMetrics(false);
        setLoadingActivities(false);
      }
    }

    loadDashboardData();
  }, [refreshKey]);

  const quickActions = [
    {
      id: 'add_vehicle',
      label: 'Add Vehicle',
      icon: Plus,
      onClick: () => setAddVehicleOpen(true),
    },
    {
      id: 'log_maintenance',
      label: 'Log Maintenance',
      icon: Wrench,
      onClick: () => setLogMaintenanceOpen(true),
    },
    {
      id: 'set_reminder',
      label: 'Set Reminder',
      icon: Bell,
      onClick: () => router.push('/reminders'),
    },
    {
      id: 'view_expenses',
      label: 'View Service & Expenses',
      icon: PhilippinePeso,
      onClick: () => setServiceExpensesOpen(true),
    },
  ];

  return (
    // Mobile adjustment: reduce horizontal padding on small screens and scale up progressively.
    <div className="px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Modals */}
      <AddVehicleModal
        isOpen={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        mode="create"
        onSaved={() => {
          setAddVehicleOpen(false);
          refreshData();
        }}
      />
      <LogMaintenanceModal
        isOpen={logMaintenanceOpen}
        onClose={() => setLogMaintenanceOpen(false)}
        onSuccess={refreshData}
      />
      <ServiceExpensesModal
        isOpen={serviceExpensesOpen}
        onClose={() => setServiceExpensesOpen(false)}
      />

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-whitePure">Dashboard</h1>
        <p className="text-textSecondary mt-1">
          Overview of your vehicles, recent activity, and reminders.
        </p>
      </div>

      {/* Metric Cards */}
      <DashboardErrorBoundary>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Vehicles', value: metrics?.totalVehicles ?? 0, icon: Car, delay: 0 },
            {
              label: 'Maintenance Records',
              value: metrics?.maintenanceRecords ?? 0,
              icon: Wrench,
              delay: 0.1,
            },
            {
              label: 'Active Reminders',
              value: metrics?.activeReminders ?? 0,
              icon: Bell,
              delay: 0.2,
            },
            {
              label: 'Monthly Expenses',
              value: formatCurrencyPHP(metrics?.monthlyExpenses ?? 0),
              icon: PhilippinePeso,
              delay: 0.3,
            },
          ].map(({ label, value, icon, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay }}
            >
              <MetricCard
                label={label}
                value={value}
                icon={icon}
                iconBgColor="bg-redPrimary"
                loading={loadingMetrics}
              />
            </motion.div>
          ))}
        </div>
      </DashboardErrorBoundary>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-4 sm:p-6"
      >
        <h3 className="text-lg font-semibold text-whitePure mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center gap-3 p-4 bg-darkBg hover:bg-[#2a2a2a] rounded-lg transition-colors group text-left"
            >
              <div className="p-2 rounded-lg bg-redPrimary group-hover:scale-110 transition-transform flex-shrink-0">
                <action.icon className="h-5 w-5 text-whitePure" />
              </div>
              <span className="text-sm font-medium text-whitePure">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activity Feed + Wrench Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardErrorBoundary>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ActivityFeed activities={activities} loading={loadingActivities} maxItems={3} />
          </motion.div>
        </DashboardErrorBoundary>

        <DashboardErrorBoundary>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <WrenchAnimation />
          </motion.div>
        </DashboardErrorBoundary>
      </div>
    </div>
  );
}

