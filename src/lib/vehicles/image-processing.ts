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

export async function optimizeImageForUpload(file: File): Promise<File> {
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

