import api from '../utils/axiosClient';

// --- Interfaces ---

export interface OptionDto {
  content: string;
}

export interface QuestionDto {
  id?: number;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK';
  options: string[];
  correctAnswer: string;
}

export interface ClassroomDto {
  id: number;
  name: string;
}

export interface AssignmentDto {
  id: number;
  title: string;
  description: string;
  classrooms: ClassroomDto[];
  questions: QuestionDto[];
}

export interface AssignmentRequestDto {
  title: string;
  description: string;
}

// --- API Methods ---

export const getAssignments = async (): Promise<AssignmentDto[]> => {
  const { data } = await api.get('/api/assignments');
  return data;
};

export const createAssignment = async (payload: AssignmentRequestDto): Promise<AssignmentDto> => {
  const { data } = await api.post('/api/assignments', payload);
  return data;
};

export const updateAssignment = async (id: number, payload: AssignmentRequestDto): Promise<AssignmentDto> => {
  const { data } = await api.put(`/api/assignments/${id}`, payload);
  return data;
};

export const deleteAssignment = async (id: number): Promise<void> => {
  await api.delete(`/api/assignments/${id}`);
};

export const assignToClassroom = async (assignmentId: number, classroomId: number): Promise<AssignmentDto> => {
  const { data } = await api.post(`/api/assignments/${assignmentId}/assign/${classroomId}`);
  return data;
};

export const addQuestionToAssignment = async (assignmentId: number, payload: QuestionDto): Promise<QuestionDto> => {
  const { data } = await api.post(`/api/assignments/${assignmentId}/questions`, payload);
  return data;
};

export const updateQuestion = async (questionId: number, payload: QuestionDto): Promise<QuestionDto> => {
  const { data } = await api.put(`/api/questions/${questionId}`, payload);
  return data;
};

export const deleteQuestion = async (questionId: number): Promise<void> => {
  await api.delete(`/api/questions/${questionId}`);
};

export const getClassrooms = async (): Promise<ClassroomDto[]> => {
  const { data } = await api.get('/api/classrooms');
  return data;
};
