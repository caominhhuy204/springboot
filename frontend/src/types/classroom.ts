export interface ClassroomStudent {
  id: number;
  username: string;
  fullname: string;
  email: string;
  studentCode?: string | null;
  invited?: boolean;
}

export interface ClassroomTeacher {
  id: number;
  username: string;
  fullname: string;
  email: string;
  teacherCode?: string | null;
  invited?: boolean;
}

export interface Classroom {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  teacherId?: number | null;
  teacherName?: string | null;
  teacherEmail?: string | null;
  studentCount: number;
  students?: ClassroomStudent[] | null;
}

export interface ClassroomPayload {
  name: string;
  description?: string;
}

export interface JoinClassroomPayload {
  code: string;
}
