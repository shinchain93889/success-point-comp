export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  student_id?: string | null;
  created_at: string;
}

export type CourseStatus = 'pending' | 'completed';

export interface StudentRecord {
  id: string;
  roll_no: string;
  student_name: string;
  father_name: string;
  course: string;
  session: string;
  start_date?: string | null;
  end_date?: string | null;
  mobile_no?: string | null;
  course_status: CourseStatus;
  certificate_url?: string | null;
  created_at: string;
  // Additional fields for official institute certificate
  enrollment_no?: string;
  duration?: string;
  subject?: string;
  marks?: string;
  grade?: string;
  // Backward compatibility fields for legacy views
  roll_number?: string;
  student_id?: string;
  name?: string;
  certificate_no?: string;
  issue_date?: string;
  phone?: string | null;
  profile_picture_url?: string | null;
  pdf_url?: string | null;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  target_type: 'student' | 'certificate';
  target_id: string;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface BulkUploadRow {
  student_id: string;
  roll_number: string;
  name: string;
  father_name: string;
  course: string;
  session: string;
  start_date?: string;
  end_date?: string;
  mobile_no?: string;
  course_status?: CourseStatus;
  certificate_no: string;
  issue_date: string;
  phone?: string;
}
