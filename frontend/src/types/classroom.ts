export interface ClassroomStudent {
  id: number;
  username: string;
  fullname: string;
  email: string;
  studentCode?: string | null;
}

export interface ClassroomTeacher {
  id: number;
  username: string;
  fullname: string;
  email: string;
  teacherCode?: string | null;
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
  code: string;
  name: string;
  description?: string;
}
