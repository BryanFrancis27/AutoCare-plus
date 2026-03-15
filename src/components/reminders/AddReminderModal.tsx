"use client";

import { useState } from 'react';
import { X, Bell, Calendar, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createReminder } from '@/app/actions/reminders';
import { LoadingState } from '@/components/ui/LoadingState';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName?: string;
}

interface ReminderFormData {
  title: string;
  reminderType: string;
  serviceCategory: string;
  description: string;
  dueDate: string;
  dueMileage: string;
  priority: string;
  notes: string;
}

const reminderTypes = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Air Filter',
  'Transmission Service',
  'Coolant Flush',
  'Battery Check',
  'Wheel Alignment',
  'Inspection',
  'Registration Renewal',
  'Insurance Renewal',
  'Custom'
];

const serviceCategories = [
  'Engine',
  'Transmission',
  'Brakes',
  'Tires',
  'Fluids',
  'Electrical',
  'Inspection',
  'Documentation',
  'Other'
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'text-green-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-400' }
];

export function AddReminderModal({ isOpen, onClose, vehicleId, vehicleName }: AddReminderModalProps) {
  const router = useRouter();
  const loadingLabel = 'Creating reminder...';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    reminderType: '',
    serviceCategory: '',
    description: '',
    dueDate: '',
    dueMileage: '',
    priority: 'medium',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ReminderFormData, string>>>({});

  const handleInputChange = (field: keyof ReminderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ReminderFormData, string>> = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.reminderType) newErrors.reminderType = 'Reminder type is required';
    if (!formData.serviceCategory) newErrors.serviceCategory = 'Service category is required';
    if (!formData.dueDate && !formData.dueMileage) {
      newErrors.dueDate = 'Either due date or due mileage is required';
      newErrors.dueMileage = 'Either due date or due mileage is required';
    }
    if (formData.dueMileage && isNaN(Number(formData.dueMileage))) {
      newErrors.dueMileage = 'Must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    const result = await createReminder({
      vehicleId,
      title: formData.title,
      reminderType: formData.reminderType,
      serviceCategory: formData.serviceCategory,
      description: formData.description,
      dueDate: formData.dueDate || undefined,
      dueMileage: formData.dueMileage ? parseInt(formData.dueMileage) : undefined,
      priority: formData.priority,
      notes: formData.notes || undefined,
    });

    setLoading(false);

    if (result.error) {
      setErrors({ title: result.error });
    } else {
      router.refresh();
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      reminderType: '',
      serviceCategory: '',
      description: '',
      dueDate: '',
      dueMileage: '',
      priority: 'medium',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!loading) {
                handleClose();
              }
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) {
                handleClose();
              }
            }}
          >
            <div className="relative bg-[#262626] border border-[#3A3A3A] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/45 backdrop-blur-sm">
                  <LoadingState mode="container" label={loadingLabel} className="min-h-[220px] w-[min(92%,460px)]" />
                </div>
              )}
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
                <div>
                  <h2 className="text-2xl font-bold text-white">Schedule Reminder</h2>
                  <p className="text-sm text-[#B0B0B0] mt-1">
                    {vehicleName ? `For ${vehicleName}` : 'Create a new maintenance reminder'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-[#3A3A3A] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#D32F2F]/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-[#D32F2F]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Reminder Details</h3>
                        <p className="text-sm text-[#B0B0B0]">Set up your maintenance reminder</p>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm text-[#B0B0B0] mb-2">
                        Title <span className="text-[#D32F2F]">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Oil Change Due"
                        className={`w-full bg-[#1D1D1C] border ${
                          errors.title ? 'border-red-500' : 'border-[#3A3A3A]'
                        } rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reminder Type */}
                      <div>
                        <label className="block text-sm text-[#B0B0B0] mb-2">
                          Reminder Type <span className="text-[#D32F2F]">*</span>
                        </label>
                        <select
                          value={formData.reminderType}
                          onChange={(e) => handleInputChange('reminderType', e.target.value)}
                          className={`w-full bg-[#1D1D1C] border ${
                            errors.reminderType ? 'border-red-500' : 'border-[#3A3A3A]'
                          } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                        >
                          <option value="">Select Type</option>
                          {reminderTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {errors.reminderType && <p className="text-red-500 text-xs mt-1">{errors.reminderType}</p>}
                      </div>

                      {/* Service Category */}
                      <div>
                        <label className="block text-sm text-[#B0B0B0] mb-2">
                          Service Category <span className="text-[#D32F2F]">*</span>
                        </label>
                        <select
                          value={formData.serviceCategory}
                          onChange={(e) => handleInputChange('serviceCategory', e.target.value)}
                          className={`w-full bg-[#1D1D1C] border ${
                            errors.serviceCategory ? 'border-red-500' : 'border-[#3A3A3A]'
                          } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                        >
                          <option value="">Select Category</option>
                          {serviceCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        {errors.serviceCategory && <p className="text-red-500 text-xs mt-1">{errors.serviceCategory}</p>}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm text-[#B0B0B0] mb-2">
                        Priority <span className="text-[#D32F2F]">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {priorityLevels.map(level => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => handleInputChange('priority', level.value)}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                              formData.priority === level.value
                                ? 'border-[#D32F2F] bg-[#D32F2F]/10'
                                : 'border-[#3A3A3A] hover:border-[#4A4A4A]'
                            }`}
                          >
                            <span className={`font-medium ${level.color}`}>{level.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Due Date */}
                      <div>
                        <label className="block text-sm text-[#B0B0B0] mb-2">
                          Due Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
                          <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => handleInputChange('dueDate', e.target.value)}
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.dueDate ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          />
                        </div>
                        {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                      </div>

                      {/* Due Mileage */}
                      <div>
                        <label className="block text-sm text-[#B0B0B0] mb-2">
                          Due Mileage
                        </label>
                        <input
                          type="text"
                          value={formData.dueMileage}
                          onChange={(e) => handleInputChange('dueMileage', e.target.value)}
                          placeholder="e.g., 5000"
                          className={`w-full bg-[#1D1D1C] border ${
                            errors.dueMileage ? 'border-red-500' : 'border-[#3A3A3A]'
                          } rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                        />
                        {errors.dueMileage && <p className="text-red-500 text-xs mt-1">{errors.dueMileage}</p>}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm text-[#B0B0B0] mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Add any additional details..."
                        rows={3}
                        className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm text-[#B0B0B0] mb-2">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional notes..."
                        rows={3}
                        className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-[#3A3A3A]">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 text-white hover:bg-[#3A3A3A] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? loadingLabel : 'Create Reminder'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
