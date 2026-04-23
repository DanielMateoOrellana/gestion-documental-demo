import { User, UserRoleEnum } from '../types';
import {
    changeDemoUserRole,
    createDemoUser,
    deleteDemoUser,
    getDemoUsers,
    simulateRequest,
    updateDemoUser,
} from '../demo/demoStore';

export type { User };

export interface CreateUserInput {
    email: string;
    fullName: string;
    password?: string;
    role: UserRoleEnum;
}

export interface UpdateUserInput {
    email?: string;
    fullName?: string;
    password?: string;
    role?: UserRoleEnum;
    isActive?: boolean;
}

export async function fetchUsers(): Promise<User[]> {
    return simulateRequest(() => getDemoUsers());
}

export async function createUser(input: CreateUserInput): Promise<User> {
    return simulateRequest(() => createDemoUser(input));
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
    return simulateRequest(() => updateDemoUser(id, input));
}

/**
 * Cambia el rol de un usuario.
 * Solo disponible para administradores.
 */
export async function changeUserRole(id: number, role: UserRoleEnum): Promise<User> {
    return simulateRequest(() => changeDemoUserRole(id, role));
}

export async function deleteUser(id: number): Promise<void> {
    await simulateRequest(() => deleteDemoUser(id));
}

