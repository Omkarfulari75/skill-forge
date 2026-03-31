import client from './client';

export interface AdminStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'instructor';
  level?: string;
  points?: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await client.get<AdminStats>('/admin/stats');
  return response.data;
};

export const getAdminUsers = async (): Promise<{ students: AdminUser[], instructors: AdminUser[] }> => {
  const response = await client.get<{ students: AdminUser[], instructors: AdminUser[] }>('/admin/users');
  return response.data;
};

export const deleteUser = async (role: string, id: number): Promise<{ message: string }> => {
  const response = await client.delete<{ message: string }>(`/admin/users/${role}/${id}`);
  return response.data;
};
