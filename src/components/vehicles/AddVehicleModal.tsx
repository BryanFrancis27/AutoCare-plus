"use client";

import { useEffect, useState } from 'react';
import { X, Car, Calendar, DollarSign, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createVehicle, updateVehicle, uploadVehicleImage } from '@/app/actions/vehicles';
import { useRouter } from 'next/navigation';
import { VEHICLE_TYPE_OPTIONS, POWERTRAIN_OPTIONS } from '@/lib/maintenance';
import { ErrorModal } from '@/components/ui/ErrorModal';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  vehicle?: EditableVehicle | null;
  onSaved?: (vehicle: any) => void;
}

interface EditableVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number?: string | null;
  color?: string | null;
  vehicle_type?: string | null;
  powertrain?: string | null;
  transmission?: string | null;
  current_mileage?: number | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  notes?: string | null;
  image_url?: string | null;
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
const MAX_VEHICLE_IMAGE_SIZE_MB = Number(process.env.NEXT_PUBLIC_VEHICLE_IMAGE_MAX_SIZE_MB ?? 5);
const MAX_VEHICLE_IMAGE_SIZE_BYTES = MAX_VEHICLE_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_RAW_IMAGE_SIZE_MB = Number(process.env.NEXT_PUBLIC_VEHICLE_IMAGE_RAW_MAX_SIZE_MB ?? 30);
const MAX_RAW_IMAGE_SIZE_BYTES = MAX_RAW_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION_PX = Number(process.env.NEXT_PUBLIC_VEHICLE_IMAGE_MAX_DIMENSION_PX ?? 1920);

function getOptimizedMimeType(fileType: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (fileType === 'image/png') return 'image/png';
  if (fileType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function getFileExtensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image.'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to process image.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function optimizeImageForUpload(file: File): Promise<File> {
  // Canvas processing strips GIF animation, so keep GIFs unchanged.
  if (file.type === 'image/gif') {
    return file;
  }

  const image = await loadImageFromFile(file);
  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > MAX_IMAGE_DIMENSION_PX ? MAX_IMAGE_DIMENSION_PX / largestSide : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const mimeType = getOptimizedMimeType(file.type);
  const supportsQuality = mimeType !== 'image/png';

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not initialize image optimization.');
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, mimeType, supportsQuality ? quality : undefined);

  while (supportsQuality && blob.size > MAX_VEHICLE_IMAGE_SIZE_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, mimeType, quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'vehicle-image';
  const extension = getFileExtensionFromMimeType(mimeType);
  return new File([blob], `${baseName}-optimized.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

const transmissionTypes = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];

const popularMakes = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Tesla', 'BMW', 'Mercedes-Benz',
  'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru',
  'Jeep', 'Ram', 'GMC', 'Dodge', 'Lexus', 'Acura', 'Volvo', 'Other'
];

export function AddVehicleModal({ isOpen, onClose, mode = 'create', vehicle = null, onSaved }: AddVehicleModalProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit' && !!vehicle?.id;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isEditMode && vehicle) {
      setCurrentStep(1);
      setFormData({
        make: vehicle.make ?? '',
        model: vehicle.model ?? '',
        year: vehicle.year ? String(vehicle.year) : '',
        licensePlate: vehicle.plate_number ?? '',
        color: vehicle.color ?? '',
        vehicleType: vehicle.vehicle_type ?? '',
        fuelType: vehicle.powertrain ?? '',
        transmission: vehicle.transmission ?? '',
        currentMileage: vehicle.current_mileage != null ? String(vehicle.current_mileage) : '',
        purchaseDate: vehicle.purchase_date ?? '',
        purchasePrice: vehicle.purchase_price != null ? String(vehicle.purchase_price) : '',
        notes: vehicle.notes ?? '',
      });
      setImagePreview(vehicle.image_url ?? null);
      setImageFile(null);
      setImageRemoved(false);
      setErrors({});
      return;
    }

    setCurrentStep(1);
    setFormData({
      make: '', model: '', year: '', licensePlate: '', color: '',
      vehicleType: '', fuelType: '', transmission: '',
      currentMileage: '', purchaseDate: '', purchasePrice: '', notes: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(false);
    setErrors({});
  }, [isEditMode, isOpen, vehicle]);

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_RAW_IMAGE_SIZE_BYTES) {
        setErrorModal({
          isOpen: true,
          message: `Image is too large to process. Please choose an image under ${MAX_RAW_IMAGE_SIZE_MB}MB.`
        });
        e.target.value = '';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorModal({
          isOpen: true,
          message: 'Please select a valid image file (PNG, JPG, JPEG, GIF, etc.).'
        });
        e.target.value = '';
        return;
      }

      try {
        setIsProcessingImage(true);
        const optimizedImage = await optimizeImageForUpload(file);

        if (optimizedImage.size > MAX_VEHICLE_IMAGE_SIZE_BYTES) {
          setErrorModal({
            isOpen: true,
            message: `Could not reduce image below ${MAX_VEHICLE_IMAGE_SIZE_MB}MB. Please choose a smaller image.`
          });
          e.target.value = '';
          return;
        }

        setImageFile(optimizedImage);
        setImageRemoved(false);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(optimizedImage);
      } catch (error) {
        console.error('Image optimization failed:', error);
        setErrorModal({
          isOpen: true,
          message: 'Could not process this image. Please choose another file and try again.'
        });
        e.target.value = '';
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    
    let imageUrl: string | null | undefined = isEditMode ? (vehicle?.image_url ?? null) : undefined;

    // Upload image if one was selected
    if (imageFile) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);

        const uploadResult = await uploadVehicleImage(uploadFormData);

        if (uploadResult.error) {
          console.error('Error uploading image:', uploadResult.error);
          setErrorModal({
            isOpen: true,
            message: `Failed to upload image. The vehicle will be ${isEditMode ? 'updated' : 'added'} without changing the photo.`
          });
        } else {
          imageUrl = uploadResult.data?.displayUrl ?? uploadResult.data?.publicUrl;
        }
      } catch (error) {
        console.error('Unexpected error uploading image:', error);
        setErrorModal({
          isOpen: true,
          message: `An unexpected error occurred while uploading the image. The vehicle will be ${isEditMode ? 'updated' : 'added'} without changing the photo.`
        });
      }
    }

    if (isEditMode && imageRemoved && !imageFile) {
      imageUrl = null;
    }

    try {
      const result = isEditMode && vehicle
        ? await updateVehicle({
            id: vehicle.id,
            make: formData.make,
            model: formData.model,
            year: parseInt(formData.year),
            licensePlate: formData.licensePlate || undefined,
            color: formData.color || undefined,
            vehicleType: formData.vehicleType || undefined,
            powertrain: formData.fuelType || undefined,
          transmission: formData.transmission || undefined,
            currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : undefined,
            purchaseDate: formData.purchaseDate || undefined,
            purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
            notes: formData.notes || undefined,
            imageUrl,
          })
        : await createVehicle({
            make: formData.make,
            model: formData.model,
            year: parseInt(formData.year),
            licensePlate: formData.licensePlate || undefined,
            color: formData.color || undefined,
            vehicleType: formData.vehicleType || undefined,
            powertrain: formData.fuelType || undefined,
          transmission: formData.transmission || undefined,
            currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : undefined,
            purchaseDate: formData.purchaseDate || undefined,
            purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
            notes: formData.notes || undefined,
            imageUrl: imageUrl ?? undefined,
          });

      if (result.error) {
        setErrorModal({
          isOpen: true,
          message: result.error,
        });
        return;
      }

      if (result.data && onSaved) {
        const savedVehicle = {
          ...(vehicle ?? {}),
          ...result.data,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          plate_number: formData.licensePlate || null,
          color: formData.color || null,
          vehicle_type: formData.vehicleType || null,
          powertrain: formData.fuelType || null,
          transmission: formData.transmission || null,
          current_mileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
          purchase_date: formData.purchaseDate || null,
          purchase_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          notes: formData.notes || null,
        } as any;

        onSaved({
          ...savedVehicle,
          image_url:
            savedVehicle.image_url ??
            savedVehicle.photo_url ??
            savedVehicle.image ??
            imageUrl ??
            null,
        });
      }

      router.refresh();
      handleClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} vehicle:`, error);
      setErrorModal({
        isOpen: true,
        message: `An unexpected error occurred while ${isEditMode ? 'updating' : 'adding'} the vehicle. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      make: '', model: '', year: '', licensePlate: '', color: '',
      vehicleType: '', fuelType: '', transmission: '',
      currentMileage: '', purchaseDate: '', purchasePrice: '', notes: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(false);
    setLoading(false);
    setIsProcessingImage(false);
    setErrors({});
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-[#262626] border border-[#3A3A3A] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]">
                <div>
                  <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
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
              <form onSubmit={(e) => e.preventDefault()}>
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
                              PNG, JPG up to {MAX_VEHICLE_IMAGE_SIZE_MB}MB after automatic optimization
                            </p>
                            <p className="text-xs text-[#B0B0B0] mt-1">
                              Raw file processing limit: {MAX_RAW_IMAGE_SIZE_MB}MB
                            </p>
                          </label>
                        )}
                        {isProcessingImage && (
                          <p className="text-xs text-[#B0B0B0] mt-2">Optimizing image for upload...</p>
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
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || isProcessingImage}
                        className="px-6 py-3 bg-[#D32F2F] text-white rounded-lg hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Vehicle' : 'Add Vehicle')}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title="Upload Error"
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
    </>
  );
}
