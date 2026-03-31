import client from './client';

export interface Course {
  id: number;
  instructor_id: number;
  title: string;
  description: string;
  difficulty: string;
  thumbnail_url: string | null;
  course_link: string | null;
}

export interface Subject {
  id: number;
  course_id: number;
  name: string;
  description: string;
}

export interface Topic {
  id: number;
  subject_id: number;
  course_id: number;
  name: string;
  description: string;
  youtube_link?: string;
  generic_link?: string;
}

export interface Material {
  id: number;
  topic_id: number;
  course_id: number;
  title: string;
  description: string;
  type: string;
  url: string;
  difficulty_level: string;
}

export const fetchInstructorCourses = async (instructorId: number): Promise<Course[]> => {
  const response = await client.get<Course[]>(`/courses/${instructorId}`);
  return response.data;
};

export const createCourse = async (formData: FormData): Promise<{ message: string, id: number }> => {
  const response = await client.post<{ message: string, id: number }>('/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateCourse = async (id: number, formData: FormData): Promise<{ message: string }> => {
  const response = await client.put<{ message: string }>(`/courses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteCourse = async (id: number): Promise<{ message: string }> => {
  const response = await client.delete<{ message: string }>(`/courses/${id}`);
  return response.data;
};

export const fetchSubjects = async (courseId: number): Promise<Subject[]> => {
  const response = await client.get<Subject[]>(`/subjects/${courseId}`);
  return response.data;
};

export const createSubject = async (subjectData: Partial<Subject>): Promise<{ message: string, id: number }> => {
  const response = await client.post<{ message: string, id: number }>('/subjects', subjectData);
  return response.data;
};

export const updateSubject = async (id: number, subjectData: Partial<Subject>): Promise<{ message: string }> => {
  const response = await client.put<{ message: string }>(`/subjects/${id}`, subjectData);
  return response.data;
};

export const deleteSubject = async (id: number): Promise<{ message: string }> => {
  const response = await client.delete<{ message: string }>(`/subjects/${id}`);
  return response.data;
};

export const fetchTopics = async (subjectId: number): Promise<Topic[]> => {
  const response = await client.get<Topic[]>(`/topics/${subjectId}`);
  return response.data;
};

export const createTopic = async (topicData: Partial<Topic>): Promise<{ message: string, id: number }> => {
  const response = await client.post<{ message: string, id: number }>('/topics', topicData);
  return response.data;
};

export const updateTopic = async (id: number, topicData: Partial<Topic>): Promise<{ message: string }> => {
  const response = await client.put<{ message: string }>(`/topics/${id}`, topicData);
  return response.data;
};

export const deleteTopic = async (id: number): Promise<{ message: string }> => {
  const response = await client.delete<{ message: string }>(`/topics/${id}`);
  return response.data;
};

export const fetchMaterials = async (topicId: number): Promise<Material[]> => {
  const response = await client.get<Material[]>(`/materials/${topicId}`);
  return response.data;
};

export const createMaterial = async (formData: FormData): Promise<{ message: string, id: number, url: string }> => {
  const response = await client.post<{ message: string, id: number, url: string }>('/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateMaterial = async (id: number, formData: FormData): Promise<{ message: string }> => {
  const response = await client.put<{ message: string }>(`/materials/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteMaterial = async (id: number): Promise<{ message: string }> => {
  const response = await client.delete<{ message: string }>(`/materials/${id}`);
  return response.data;
};
