import type { ProcessCategory } from './processCategories';
import {
  createDemoProcessType,
  deleteDemoProcessType,
  getDemoProcessTypes,
  simulateRequest,
  updateDemoProcessType,
} from '../demo/demoStore';

export type ProcessType = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  categoryId: number;
  category: ProcessCategory | null;
  _count?: {
    templates: number;
  };
};

export type CreateProcessTypeInput = {
  name: string;
  description: string;
  categoryId: number;
  isActive: boolean;
};

export async function fetchProcessTypes(): Promise<ProcessType[]> {
  return simulateRequest(() => getDemoProcessTypes());
}

export async function createProcessType(
  input: CreateProcessTypeInput,
): Promise<ProcessType> {
  return simulateRequest(() => createDemoProcessType(input));
}

export type UpdateProcessTypeInput = Partial<CreateProcessTypeInput>;

export async function updateProcessType(
  id: number,
  input: UpdateProcessTypeInput,
): Promise<ProcessType> {
  return simulateRequest(() => updateDemoProcessType(id, input));
}

export async function deleteProcessType(id: number): Promise<void> {
  await simulateRequest(() => deleteDemoProcessType(id));
}
