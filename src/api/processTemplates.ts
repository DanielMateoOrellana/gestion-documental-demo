import type { ProcessType } from './processTypes';
import {
  createDemoTemplate,
  deleteDemoTemplate,
  getDemoTemplate,
  getDemoTemplates,
  simulateRequest,
  updateDemoTemplate,
} from '../demo/demoStore';

export type ProcessTemplateStep = {
  id: number;
  templateId: number;
  order: number;
  name: string;
  description?: string;
  responsibleRole?: string;
  dueDaysFromStart?: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProcessTemplate = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  isLocked: boolean;
  processTypeId: number;
  createdAt: string;
  updatedAt: string;

  // relaciones
  processType?: ProcessType;
  steps?: ProcessTemplateStep[];
};

export type CreateTemplateStepInput = {
  order: number;
  name: string;
  description?: string;
  responsibleRole?: string;
  dueDaysFromStart?: number;
  isMandatory?: boolean;
};

export type CreateProcessTemplateInput = {
  name: string;
  description: string;
  processTypeId: number;
  isActive?: boolean;
  isLocked?: boolean;
  steps?: CreateTemplateStepInput[];
};

export type UpdateProcessTemplateInput = Partial<CreateProcessTemplateInput>;

export async function fetchProcessTemplates(): Promise<ProcessTemplate[]> {
  return simulateRequest(() => getDemoTemplates());
}

export async function fetchProcessTemplate(id: number): Promise<ProcessTemplate> {
  return simulateRequest(() => getDemoTemplate(id));
}

export async function createProcessTemplate(
  input: CreateProcessTemplateInput,
): Promise<ProcessTemplate> {
  return simulateRequest(() => createDemoTemplate(input));
}

export async function updateProcessTemplate(
  id: number,
  input: UpdateProcessTemplateInput,
): Promise<ProcessTemplate> {
  return simulateRequest(() => updateDemoTemplate(id, input));
}

export async function deleteProcessTemplate(id: number): Promise<void> {
  await simulateRequest(() => deleteDemoTemplate(id));
}
