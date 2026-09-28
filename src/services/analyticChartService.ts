import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../config/firebase';
import type { AnalyticResultChart } from '../types/analyticType';

const MAX_CHART_BYTES = 8 * 1024 * 1024;

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function validateAnalyticChart(file: File): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Choose a PNG, JPG, or WebP chart image.';
  if (file.size > MAX_CHART_BYTES) return 'Chart image must be 8 MB or smaller.';
  return null;
}

export async function uploadAnalyticChart(
  file: File,
  patientId: string,
  visitId: string,
  analyticTypeId: string,
): Promise<AnalyticResultChart> {
  const validationError = validateAnalyticChart(file);
  if (validationError) throw new Error(validationError);
  if (!app) throw new Error('Firebase is not initialized.');

  const storagePath = [
    'analytic-result-charts',
    safeSegment(patientId),
    safeSegment(visitId),
    `${safeSegment(analyticTypeId)}-chart`,
  ].join('/');
  const chartRef = ref(getStorage(app), storagePath);
  await uploadBytes(chartRef, file, { contentType: file.type, customMetadata: { originalName: file.name } });
  return { url: await getDownloadURL(chartRef), storagePath, fileName: file.name };
}
