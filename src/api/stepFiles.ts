import {
  deleteDemoStepFile,
  downloadDemoStepFile,
  getDemoFileViewUrl,
  getDemoStepFiles,
  simulateRequest,
  uploadDemoStepFile,
} from '../demo/demoStore';

export type StepFileSummary = {
  id: number;
  stepId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  uploadedAt: string;
  uploadedById: number | null;
  uploadedBy?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
};

export async function listStepFiles(stepId: number): Promise<StepFileSummary[]> {
  return simulateRequest(() => getDemoStepFiles(stepId));
}

export async function uploadStepFile(
  stepId: number,
  file: File,
): Promise<StepFileSummary> {
  return simulateRequest(() => uploadDemoStepFile(stepId, file));
}

export async function downloadStepFile(
  stepId: number,
  fileId: number,
): Promise<Blob> {
  return simulateRequest(() => downloadDemoStepFile(stepId, fileId));
}

export async function deleteStepFile(
  stepId: number,
  fileId: number,
): Promise<void> {
  await simulateRequest(() => deleteDemoStepFile(stepId, fileId));
}

export function getFileViewUrl(
  stepId: number,
  fileId: number,
): string {
  return getDemoFileViewUrl(stepId, fileId);
}

export async function getFilePresignedUrl(
  stepId: number,
  fileId: number,
): Promise<{ url: string; fileName: string }> {
  const url = getFileViewUrl(stepId, fileId);
  return { url, fileName: '' };
}
