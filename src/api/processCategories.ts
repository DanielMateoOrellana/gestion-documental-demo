import {
  createDemoCategory,
  deleteDemoCategory,
  getDemoCategories,
  simulateRequest,
  updateDemoCategory,
} from '../demo/demoStore';

export type ProcessCategory = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  _count?: {
    processTypes: number;
  };
};

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export async function fetchProcessCategories(): Promise<ProcessCategory[]> {
  return simulateRequest(() => getDemoCategories());
}

export async function createProcessCategory(input: CreateCategoryInput): Promise<ProcessCategory> {
  return simulateRequest(() => createDemoCategory(input));
}

export async function updateProcessCategory(id: number, input: UpdateCategoryInput): Promise<ProcessCategory> {
  return simulateRequest(() => updateDemoCategory(id, input));
}

export async function deleteProcessCategory(id: number): Promise<void> {
  await simulateRequest(() => deleteDemoCategory(id));
}

