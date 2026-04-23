import { UserRoleEnum } from '../types';
import {
  getDemoUserFromToken,
  loginDemoUser,
  registerDemoUser,
  simulateRequest,
} from '../demo/demoStore';

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: UserRoleEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export async function loginApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return simulateRequest(() => loginDemoUser(email, password));
}

export async function fetchMe(): Promise<AuthUser> {
  return simulateRequest(() =>
    getDemoUserFromToken(localStorage.getItem('auth_token')),
  );
}

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  role?: UserRoleEnum;
};

export async function registerApi(input: RegisterInput): Promise<AuthUser> {
  return simulateRequest(() => registerDemoUser(input));
}
