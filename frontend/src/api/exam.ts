import api from "@/utils/axiosClient";

export interface Question {
  id: number;
  content: string;
  type: "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
  options?: string;
  points: number;
}

export interface ExamDetail {
  id: number;
  title: string;
  description: string;
  timeLimitMinutes: number;
  questions: Question[];
}

export interface AnswerPayload {
  questionId: number;
  studentAnswer: string;
}

export interface SubmitResponse {
  submissionId: number;
  examId: number;
  totalScore: number;
  submitTime: string;
  correctAnswersCount: number;
  totalQuestionsCount: number;
}

export interface HistoryResponse {
  submissionId: number;
  examId: number;
  examTitle: string;
  totalScore: number;
  submitTime: string;
}

export const examApi = {
  getExamDetail: async (examId: string | number): Promise<ExamDetail | null> => {
    try {
      const res = await api.get(`/api/exams/${examId}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching exam:", error);
      return null;
    }
  },

  submitExam: async (examId: string | number, answers: AnswerPayload[]): Promise<SubmitResponse | null> => {
    try {
      const res = await api.post(`/api/exams/${examId}/submit`, { answers });
      return res.data;
    } catch (error) {
      console.error("Error submitting exam:", error);
      throw error;
    }
  },

  getHistory: async (): Promise<HistoryResponse[]> => {
    try {
      const res = await api.get('/api/exams/history');
      return res.data;
    } catch (error) {
      console.error("Error fetching history:", error);
      return [];
    }
  }
};
