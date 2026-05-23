import client from './client';
import type { Course } from './instructor';

export interface StudentProgress {
  course_id: number;
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
  courseLevel?: string;
}

export const fetchAvailableCourses = async (): Promise<Course[]> => {
  const response = await client.get<Course[]>('/all-courses');
  return response.data;
};

export const fetchCourseDashboard = async (studentId: number, courseId: number) => {
  const response = await client.get(`/course-dashboard/${studentId}/${courseId}`);
  return response.data;
};

export const updateCourseProgress = async (data: {
  student_id: number;
  course_id: number;
  topic_id: number;
  score: number;
  status: string;
}) => {
  const response = await client.post('/update-course-progress', data);
  return response.data;
};
