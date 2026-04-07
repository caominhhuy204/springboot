import api from '../utils/axiosClient';

// --- Interfaces ---

export interface OptionDto {
  content: string;
}

export interface QuestionDto {
  id?: number;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK';
  options: string[] | string;
  correctAnswer: string;
  points?: number;
}

export interface ClassroomDto {
  id: number;
  name: string;
}

export interface AssignmentDto {
  id: number;
  title: string;
  description: string;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
  dueAt?: string | null;
  remainingAttempts?: number | null;
  canManage?: boolean | null;
  classrooms: ClassroomDto[];
  questions: QuestionDto[];
}

export interface AssignmentRequestDto {
  title: string;
  description: string;
  maxAttempts?: number;
  timeLimitMinutes?: number | null;
  dueAt?: string | null;
}

// --- API Helpers ---

const parseOptions = (data: any) => {
  if (data && data.options && typeof data.options === 'string') {
    try {
      data.options = JSON.parse(data.options);
    } catch {
      data.options = [];
    }
  }
  return data;
};

const parseAssignmentOptions = (data: any) => {
  if (data && data.questions && Array.isArray(data.questions)) {
    data.questions.forEach(parseOptions);
  }
  return data;
};

// --- API Methods ---

export const getAssignments = async (): Promise<AssignmentDto[]> => {
  const { data } = await api.get('/api/assignments');
  return data.map(parseAssignmentOptions);
};

export const createAssignment = async (payload: AssignmentRequestDto): Promise<AssignmentDto> => {
  const { data } = await api.post('/api/assignments', payload);
  return parseAssignmentOptions(data);
};

export const updateAssignment = async (id: number, payload: AssignmentRequestDto): Promise<AssignmentDto> => {
  const { data } = await api.put(`/api/assignments/${id}`, payload);
  return parseAssignmentOptions(data);
};

export const deleteAssignment = async (id: number): Promise<void> => {
  await api.delete(`/api/assignments/${id}`);
};

export const assignToClassrooms = async (assignmentId: number, classroomIds: number[]): Promise<void> => {
  await api.post(`/api/assignments/${assignmentId}/classrooms`, { classroomIds });
};

export const addQuestionToAssignment = async (assignmentId: number, payload: QuestionDto): Promise<QuestionDto> => {
  const submitPayload = { ...payload, options: JSON.stringify(payload.options || []) };
  const { data } = await api.post(`/api/assignments/${assignmentId}/questions`, submitPayload);
  return parseOptions(data);
};

export const updateQuestion = async (
  assignmentId: number,
  questionId: number,
  payload: QuestionDto,
): Promise<QuestionDto> => {
  const submitPayload = { ...payload, options: JSON.stringify(payload.options || []) };
  const { data } = await api.put(`/api/assignments/${assignmentId}/questions/${questionId}`, submitPayload);
  return parseOptions(data);
};

export const deleteQuestion = async (assignmentId: number, questionId: number): Promise<void> => {
  await api.delete(`/api/assignments/${assignmentId}/questions/${questionId}`);
};

export const getClassrooms = async (): Promise<ClassroomDto[]> => {
  const { data } = await api.get('/api/classrooms');
  return data;
};
