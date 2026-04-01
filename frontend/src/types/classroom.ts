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

export interface ClassroomMember {
  id: number;
  username: string;
  fullname: string;
  email: string;
  code?: string | null;
  pending?: boolean;
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
  teachers?: ClassroomTeacher[] | null;
}

export interface ClassroomPayload {
  name: string;
  description?: string;
}

export interface JoinClassroomPayload {
  code: string;
}
