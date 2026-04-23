import {
  addDemoStepToProcess,
  assignDemoStep,
  buildDemoBulkExport,
  buildDemoProcessExport,
  createDemoProcess,
  deleteDemoProcess,
  getDemoProcesses,
  importDemoProcess,
  simulateRequest,
  unassignDemoStep,
  updateDemoProcessResponsible,
} from '../demo/demoStore';

export type EstadoProceso = 'PENDIENTE' | 'COMPLETADO';
export type EstadoPaso = 'PENDIENTE' | 'COMPLETADO';

export type StepInstance = {
  id: number;
  title: string;
  estado: EstadoPaso;
  comment: string | null;
  processInstanceId: number;
  templateStepId: number;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId?: number | null;
  assignedTo?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
  templateStep?: {
    id: number;
    name: string;
    description: string | null;
    order: number;
    isMandatory: boolean;
  } | null;
};

export type ProcessInstance = {
  id: number;
  title: string;
  estado: EstadoProceso;
  processTypeId: number;
  templateId: number;
  responsibleUserId: number | null;
  responsibleUser?: {
    id: number;
    fullName: string;
    email: string;
  };
  year: number | null;
  month: number | null;
  comment: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  processType?: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
  };
  template?: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    processTypeId: number;
    createdAt: string;
    updatedAt: string;
  };
  steps?: StepInstance[];
};

export type CreateProcessInstanceInput = {
  processTypeId: number;
  templateId: number;
  title: string;
  comment?: string;
  year?: number;
  month?: number;
  dueAt?: string;
  responsibleUserId?: number;
};

export async function createProcessInstance(
  input: CreateProcessInstanceInput,
): Promise<ProcessInstance> {
  return simulateRequest(() => createDemoProcess(input));
}

export async function fetchProcessInstances(search?: string): Promise<ProcessInstance[]> {
  return simulateRequest(() => getDemoProcesses(search));
}

export async function downloadProcessZip(processId: number): Promise<Blob> {
  return simulateRequest(() => buildDemoProcessExport(processId).blob);
}

export type ImportProcessResult = {
  process: ProcessInstance;
  stats: {
    filesImported: number;
    filesSkipped: number;
    stepsCreated: number;
  };
};

export async function importProcessZip(
  file: File,
  processTypeId: number,
  templateId: number,
  title?: string,
  year?: number,
): Promise<ImportProcessResult> {
  return simulateRequest(() =>
    importDemoProcess(file, processTypeId, templateId, title, year),
  );
}

export async function exportBulkProcesses(ids: number[]): Promise<Blob> {
  return simulateRequest(() => buildDemoBulkExport(ids));
}

export async function deleteProcessInstance(id: number): Promise<void> {
  await simulateRequest(() => deleteDemoProcess(id));
}

export async function addStepToProcess(
  processId: number,
  stepName: string,
): Promise<{ templateStep: any; stepInstance: any; message: string }> {
  return simulateRequest(() => addDemoStepToProcess(processId, stepName));
}

// Delegar un paso a un usuario
export async function assignStep(
  stepId: number,
  assignedToId: number,
): Promise<StepInstance> {
  return simulateRequest(() => assignDemoStep(stepId, assignedToId));
}

export async function unassignStep(stepId: number): Promise<StepInstance> {
  return simulateRequest(() => unassignDemoStep(stepId));
}

export async function updateProcessResponsible(
  processId: number,
  responsibleUserId: number | null,
): Promise<ProcessInstance> {
  return simulateRequest(() =>
    updateDemoProcessResponsible(processId, responsibleUserId),
  );
}

