export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface UserRolePayload {
  id?: number;
  name?: UserRole | string;
}

export interface UserProfile {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  department?: string | null;
  specialization?: string | null;
  studentCode?: string | null;
  teacherCode?: string | null;
}

export interface UserProfileApiResponse extends Omit<UserProfile, "role"> {
  role: UserRole | UserRolePayload;
}

export interface UpdateProfilePayload {
  fullname: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  department?: string;
  specialization?: string;
}

export interface AdminUpdateUserPayload extends UpdateProfilePayload {
  username: string;
  email: string;
  role: UserRole;
  studentCode?: string;
  teacherCode?: string;
}
