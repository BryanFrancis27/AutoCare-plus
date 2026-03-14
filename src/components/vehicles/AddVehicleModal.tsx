"use client";

import { useState } from 'react';
import { X, Car, Calendar, DollarSign, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createVehicle } from '@/app/actions/vehicles';
import { useRouter } from 'next/navigation';
import { VEHICLE_TYPE_OPTIONS, POWERTRAIN_OPTIONS } from '@/lib/maintenance';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ErrorModal } from '@/components/ui/ErrorModal';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VehicleFormData {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  currentMileage: string;
  purchaseDate: string;
  purchasePrice: string;
  notes: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

const transmissionTypes = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];

const popularMakes = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Tesla', 'BMW', 'Mercedes-Benz',
  'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru',
  'Jeep', 'Ram', 'GMC', 'Dodge', 'Lexus', 'Acura', 'Volvo', 'Other'
];

export function AddVehicleModal({ isOpen, onClose }: AddVehicleModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '', model: '', year: '', licensePlate: '', color: '',
    vehicleType: '', fuelType: '', transmission: '',
    currentMileage: '', purchaseDate: '', purchasePrice: '', notes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorModal({
          isOpen: true,
          message: 'File size must be less than 50MB. Please select a smaller image.'
        });
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorModal({
          isOpen: true,
          message: 'Please select a valid image file (PNG, JPG, JPEG, GIF, etc.).'
        });
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {};

    if (step === 1) {
      if (!formData.make) newErrors.make = 'Make is required';
      if (!formData.model) newErrors.model = 'Model is required';
      if (!formData.year) newErrors.year = 'Year is required';
      if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    }

    if (step === 2) {
      if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';
      if (!formData.transmission) newErrors.transmission = 'Transmission is required';
      if (!formData.currentMileage) newErrors.currentMileage = 'Current mileage is required';
      else if (isNaN(Number(formData.currentMileage))) newErrors.currentMileage = 'Must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setLoading(true);
    
    let imageUrl: string | undefined = undefined;

    // Upload image if one was selected
    if (imageFile) {
      try {
        const supabase = createSupabaseBrowserClient();
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `vehicle-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicles')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setErrorModal({
            isOpen: true,
            message: 'Failed to upload image. The vehicle will be added without a photo.'
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('vehicles')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      } catch (error) {
        console.error('Unexpected error uploading image:', error);
        setErrorModal({
          isOpen: true,
          message: 'An unexpected error occurred while uploading the image. The vehicle will be added without a photo.'
        });
      }
    }

    const result = await createVehicle({
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      licensePlate: formData.licensePlate || undefined,
      color: formData.color || undefined,
      vehicleType: formData.vehicleType || undefined,
      powertrain: formData.fuelType || undefined,
      currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      notes: formData.notes || undefined,
      imageUrl,
    });

    setLoading(false);

    if (result.error) {
      setErrors({ make: result.error });
    } else {
      router.refresh();
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      make: '', model: '', year: '', licensePlate: '', color: '',
      vehicleType: '', fuelType: '', transmission: '',
      currentMileage: '', purchaseDate: '', purchasePrice: '', notes: ''
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <div className="bg-[#262626] border border-[#3A3A3A] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
                <div>
                  <h2 className="text-2xl font-bold text-white">Add New Vehicle</h2>
                  <p className="text-sm text-[#B0B0B0] mt-1">
                    Step {currentStep} of 3: {
                      currentStep === 1 ? 'Basic Information' :
                      currentStep === 2 ? 'Vehicle Details' :
                      'Additional Information'
                    }
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#3A3A3A] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pt-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        step <= currentStep ? 'bg-[#D32F2F]' : 'bg-[#3A3A3A]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#D32F2F]/10 flex items-center justify-center">
                          <Car className="w-5 h-5 text-[#D32F2F]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                          <p className="text-sm text-[#B0B0B0]">Essential details about your vehicle</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Make */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Make <span className="text-[#D32F2F]">*</span>
                          </label>
                          <select
                            value={formData.make}
                            onChange={(e) => handleInputChange('make', e.target.value)}
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.make ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          >
                            <option value="">Select Make</option>
                            {popularMakes.map(make => (
                              <option key={make} value={make}>{make}</option>
                            ))}
                          </select>
                          {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
                        </div>

                        {/* Model */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Model <span className="text-[#D32F2F]">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.model}
                            onChange={(e) => handleInputChange('model', e.target.value)}
                            placeholder="e.g., Camry"
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.model ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          />
                          {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                        </div>

                        {/* Year */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Year <span className="text-[#D32F2F]">*</span>
                          </label>
                          <select
                            value={formData.year}
                            onChange={(e) => handleInputChange('year', e.target.value)}
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.year ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          >
                            <option value="">Select Year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                        </div>

                        {/* Vehicle Type */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Vehicle Type <span className="text-[#D32F2F]">*</span>
                          </label>
                          <select
                            value={formData.vehicleType}
                            onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.vehicleType ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          >
                            <option value="">Select Type</option>
                            {VEHICLE_TYPE_OPTIONS.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          {errors.vehicleType && <p className="text-red-500 text-xs mt-1">{errors.vehicleType}</p>}
                        </div>

                        {/* License Plate */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            License Plate
                          </label>
                          <input
                            type="text"
                            value={formData.licensePlate}
                            onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                            placeholder="ABC-1234"
                            className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all"
                          />
                        </div>

                        {/* Color */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Color
                          </label>
                          <input
                            type="text"
                            value={formData.color}
                            onChange={(e) => handleInputChange('color', e.target.value)}
                            placeholder="e.g., Silver"
                            className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Vehicle Details */}
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#D32F2F]/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#D32F2F]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Vehicle Details</h3>
                          <p className="text-sm text-[#B0B0B0]">Technical specifications</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Fuel Type */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Fuel Type <span className="text-[#D32F2F]">*</span>
                          </label>
                          <select
                            value={formData.fuelType}
                            onChange={(e) => handleInputChange('fuelType', e.target.value)}
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.fuelType ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          >
                            <option value="">Select Fuel Type</option>
                            {POWERTRAIN_OPTIONS.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          {errors.fuelType && <p className="text-red-500 text-xs mt-1">{errors.fuelType}</p>}
                        </div>

                        {/* Transmission */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Transmission <span className="text-[#D32F2F]">*</span>
                          </label>
                          <select
                            value={formData.transmission}
                            onChange={(e) => handleInputChange('transmission', e.target.value)}
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.transmission ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          >
                            <option value="">Select Transmission</option>
                            {transmissionTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          {errors.transmission && <p className="text-red-500 text-xs mt-1">{errors.transmission}</p>}
                        </div>

                        {/* Current Mileage */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Current Mileage (miles) <span className="text-[#D32F2F]">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.currentMileage}
                            onChange={(e) => handleInputChange('currentMileage', e.target.value)}
                            placeholder="e.g., 45000"
                            className={`w-full bg-[#1D1D1C] border ${
                              errors.currentMileage ? 'border-red-500' : 'border-[#3A3A3A]'
                            } rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all`}
                          />
                          {errors.currentMileage && <p className="text-red-500 text-xs mt-1">{errors.currentMileage}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Additional Information */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#D32F2F]/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[#D32F2F]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Additional Information</h3>
                          <p className="text-sm text-[#B0B0B0]">Purchase details and notes</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Purchase Date */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Purchase Date
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
                            <input
                              type="date"
                              value={formData.purchaseDate}
                              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                              className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        {/* Purchase Price */}
                        <div>
                          <label className="block text-sm text-[#B0B0B0] mb-2">
                            Purchase Price
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0B0B0]" />
                            <input
                              type="text"
                              value={formData.purchasePrice}
                              onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                              placeholder="25000"
                              className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm text-[#B0B0B0] mb-2">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Add any additional notes about your vehicle..."
                          rows={4}
                          className="w-full bg-[#1D1D1C] border border-[#3A3A3A] rounded-lg px-4 py-3 text-white placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-transparent transition-all resize-none"
                        />
                      </div>

                      {/* Photo Upload (Optional) */}
                      <div>
                        <label className="block text-sm text-[#B0B0B0] mb-2">
                          Vehicle Photo (Optional)
                        </label>
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Vehicle preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-[#3A3A3A] rounded-lg p-6 text-center hover:border-[#D32F2F]/50 transition-colors cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                            <Upload className="w-8 h-8 text-[#B0B0B0] mx-auto mb-2" />
                            <p className="text-sm text-[#B0B0B0]">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-[#B0B0B0] mt-1">
                              PNG, JPG up to 5MB
                            </p>
                          </label>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-[#3A3A3A]">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 text-white hover:bg-[#3A3A3A] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-3 bg-[#3A3A3A] text-white rounded-lg hover:bg-[#4A4A4A] transition-colors"
                      >
                        Back
                      </button>
                    )}
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-6 py-3 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Adding...' : 'Add Vehicle'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title="Upload Error"
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
    </AnimatePresence>
  );
}
