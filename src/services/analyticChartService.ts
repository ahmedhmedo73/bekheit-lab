import type { AnalyticResultChart } from '../types/analyticType';

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_STORED_BYTES = 450 * 1024;
const MAX_DIMENSION = 1400;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected chart image could not be read.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('The selected chart image could not be processed.'));
    }, 'image/webp', quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The processed chart image could not be saved.'));
    reader.readAsDataURL(blob);
  });
}

export function validateAnalyticChart(file: File): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Choose a PNG, JPG, or WebP chart image.';
  if (file.size > MAX_SOURCE_BYTES) return 'Chart image must be 8 MB or smaller.';
  return null;
}

export async function prepareAnalyticChart(file: File): Promise<AnalyticResultChart> {
  const validationError = validateAnalyticChart(file);
  if (validationError) throw new Error(validationError);

  const image = await loadImage(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  let scale = Math.min(1, MAX_DIMENSION / largestSide);

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Chart image processing is not supported by this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, Math.max(0.5, 0.86 - attempt * 0.06));
    if (blob.size <= MAX_STORED_BYTES) {
      return {
        url: await blobToDataUrl(blob),
        storagePath: 'firestore-inline',
        fileName: file.name,
      };
    }
    scale *= 0.82;
  }

  throw new Error('The chart image is too detailed to save. Choose a smaller image.');
}
