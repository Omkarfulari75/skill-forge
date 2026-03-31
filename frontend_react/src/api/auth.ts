import client from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  level?: string;
  points?: number;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export const loginUser = async (role: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/login', { role, email, password });
  return response.data;
};

export const registerUser = async (name: string, email: string, password: string, role: string): Promise<{ message: string }> => {
  const response = await client.post<{ message: string }>('/register', { name, email, password, role });
  return response.data;
};
