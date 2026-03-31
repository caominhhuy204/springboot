export interface PronunciationSubmission {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  audioUrl: string;
  originalFilename: string;
  fileSizeBytes: number;
  durationSeconds: number;
  attemptNumber: number;
  autoCompletenessScore: number;
  autoFluencyScore: number;
  autoConsistencyScore: number;
  autoOverallScore: number;
  autoFeedback: string;
  teacherScore?: number | null;
  teacherFeedback?: string | null;
  reviewedByName?: string | null;
  reviewStatus: "PENDING" | "REVIEWED";
  reviewedAt?: string | null;
  submittedAt: string;
}

export interface PronunciationExercise {
  id: number;
  classroomId: number;
  classroomName: string;
  title: string;
  referenceText: string;
  description?: string | null;
  focusSkill?: string | null;
  difficultyLevel: number;
  maxAttempts: number;
  submissionCount: number;
  createdAt: string;
  createdByName: string;
  submissions?: PronunciationSubmission[] | null;
}

export interface PronunciationExercisePayload {
  title: string;
  referenceText: string;
  description?: string;
  focusSkill?: string;
  difficultyLevel?: number;
  maxAttempts?: number;
}

export interface PronunciationReviewPayload {
  teacherScore: number;
  teacherFeedback?: string;
}
