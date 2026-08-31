import { StudentRecord, UserProfile, AuditLog } from '@/lib/types/portal';

export const INITIAL_MOCK_STUDENTS: StudentRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    roll_no: '10101',
    student_name: 'Rahul Sharma',
    father_name: 'Vijay Sharma',
    course: 'Diploma in Computer Application (DCA)',
    session: '2023-2024',
    start_date: '2023-07-01',
    end_date: '2024-06-30',
    mobile_no: '+91 9876543210',
    course_status: 'completed',
    certificate_url: null,
    created_at: new Date('2024-05-15').toISOString(),
    student_id: 'SP2024001',
    name: 'Rahul Sharma',
    certificate_no: 'SP-2024-DCA-001',
    issue_date: '2024-05-15',
    phone: '+91 9876543210',
    profile_picture_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    roll_no: '10102',
    student_name: 'Priya Patel',
    father_name: 'Ramesh Patel',
    course: 'Post Graduate Diploma in Computer Application (PGDCA)',
    session: '2023-2024',
    start_date: '2023-08-01',
    end_date: '2024-07-31',
    mobile_no: '+91 9876543211',
    course_status: 'pending',
    certificate_url: null,
    created_at: new Date('2024-06-20').toISOString(),
    student_id: 'SP2024002',
    name: 'Priya Patel',
    certificate_no: 'SP-2024-PGDCA-002',
    issue_date: '2024-06-20',
    phone: '+91 9876543211',
    profile_picture_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    roll_no: '10103',
    student_name: 'Amit Kumar',
    father_name: 'Suresh Kumar',
    course: 'Advanced Diploma in Financial Accounting (ADFA)',
    session: '2023-2024',
    start_date: '2023-06-01',
    end_date: '2024-05-31',
    mobile_no: '+91 9876543212',
    course_status: 'completed',
    certificate_url: null,
    created_at: new Date('2024-07-10').toISOString(),
    student_id: 'SP2024003',
    name: 'Amit Kumar',
    certificate_no: 'SP-2024-ADFA-003',
    issue_date: '2024-07-10',
    phone: '+91 9876543212',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    roll_no: 'TEST001',
    student_name: 'Test Student',
    father_name: 'Test Father',
    course: 'DCA',
    session: '2023-2024',
    start_date: '2023-07-01',
    end_date: '2024-06-30',
    mobile_no: '+91 9999999999',
    course_status: 'pending',
    certificate_url: null,
    created_at: new Date('2024-08-01').toISOString(),
    student_id: 'TEST001',
    name: 'Test Student',
    certificate_no: 'SP-2024-DCA-TEST001',
    issue_date: '2024-08-01',
    phone: '+91 9999999999',
  },
];

export const INITIAL_MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    user_id: 'admin-001',
    user_email: 'admin@gmail.com',
    action: 'CREATE_STUDENT',
    target_type: 'student',
    target_id: 'SP2024001',
    details: { name: 'Rahul Sharma', course: 'DCA', certificate_no: 'SP-2024-DCA-001' },
    created_at: new Date('2024-05-15T10:30:00Z').toISOString(),
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    user_id: 'admin-001',
    user_email: 'admin@gmail.com',
    action: 'UPLOAD_CERTIFICATE',
    target_type: 'certificate',
    target_id: 'SP-2024-PGDCA-002',
    details: { student_id: 'SP2024002', issue_date: '2024-06-20' },
    created_at: new Date('2024-06-20T14:15:00Z').toISOString(),
  },
];

// Helper functions for client-side state management when Supabase env is not configured
const STORAGE_KEY_STUDENTS = 'sp_portal_students_v1';
const STORAGE_KEY_AUDIT_LOGS = 'sp_portal_audit_logs_v1';
const STORAGE_KEY_CURRENT_USER = 'sp_portal_current_user_v1';

function generateUUID(): string {
  if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined' && typeof window.crypto.getRandomValues === 'function') {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
      (c ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getStoredStudents(): StudentRecord[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_STUDENTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_MOCK_STUDENTS));
      return INITIAL_MOCK_STUDENTS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_MOCK_STUDENTS;
  }
}

export function saveStoredStudents(students: StudentRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
}

export function addStoredStudent(studentData: any): StudentRecord {
  const students = getStoredStudents();
  const rollNo = studentData.roll_no || studentData.roll_number || studentData.student_id || '10100';
  const name = studentData.student_name || studentData.name || 'Student';
  const certNo = studentData.certificate_no || `SP-2024-${rollNo}`;

  const newStudent: StudentRecord = {
    ...studentData,
    id: generateUUID(),
    roll_no: rollNo,
    student_name: name,
    father_name: studentData.father_name || '',
    course: studentData.course || '',
    session: studentData.session || '',
    start_date: studentData.start_date || null,
    end_date: studentData.end_date || null,
    mobile_no: studentData.mobile_no || studentData.phone || '',
    course_status: studentData.course_status || 'pending',
    certificate_url: studentData.certificate_url || studentData.pdf_url || null,
    created_at: new Date().toISOString(),
    roll_number: rollNo,
    student_id: studentData.student_id || rollNo,
    name: name,
    certificate_no: certNo,
    issue_date: studentData.issue_date || new Date().toISOString().split('T')[0],
    phone: studentData.mobile_no || studentData.phone || '',
  };

  const updated = [newStudent, ...students];
  saveStoredStudents(updated);
  addAuditLog('CREATE_STUDENT', 'student', newStudent.roll_no, {
    name: newStudent.student_name,
    course: newStudent.course,
    certificate_no: newStudent.certificate_no,
  });
  return newStudent;
}

export function updateStoredStudent(id: string, updates: Partial<StudentRecord>): StudentRecord | null {
  const students = getStoredStudents();
  const index = students.findIndex(
    (s) => s.id === id || s.roll_no === id || s.student_id === id || s.roll_number === id
  );
  if (index === -1) return null;

  const existing = students[index];
  const updatedStudent: StudentRecord = {
    ...existing,
    ...updates,
    student_name: updates.student_name || updates.name || existing.student_name,
    name: updates.student_name || updates.name || existing.name,
    roll_no: updates.roll_no || updates.roll_number || existing.roll_no,
    roll_number: updates.roll_no || updates.roll_number || existing.roll_number,
  };
  students[index] = updatedStudent;
  saveStoredStudents(students);

  addAuditLog('UPDATE_STUDENT', 'student', updatedStudent.roll_no, updates);
  return updatedStudent;
}

export function deleteStoredStudent(id: string): boolean {
  const students = getStoredStudents();
  const target = students.find(
    (s) => s.id === id || s.roll_no === id || s.student_id === id || s.roll_number === id
  );
  if (!target) return false;

  const filtered = students.filter(
    (s) => s.id !== id && s.roll_no !== id && s.student_id !== id && s.roll_number !== id
  );
  saveStoredStudents(filtered);
  addAuditLog('DELETE_STUDENT', 'student', target.roll_no, { name: target.student_name || target.name });
  return true;
}

export function getStoredAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_AUDIT_LOGS;
  try {
    const data = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(INITIAL_MOCK_AUDIT_LOGS));
      return INITIAL_MOCK_AUDIT_LOGS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_MOCK_AUDIT_LOGS;
  }
}

export function addAuditLog(action: string, target_type: 'student' | 'certificate', target_id: string, details?: any) {
  if (typeof window === 'undefined') return;
  const logs = getStoredAuditLogs();
  const currentUser = getCurrentPortalUser();
  const newLog: AuditLog = {
    id: generateUUID(),
    user_id: currentUser?.id || 'demo-user',
    user_email: currentUser?.full_name || 'admin@gmail.com',
    action,
    target_type,
    target_id,
    details,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify([newLog, ...logs]));
}

export function getCurrentPortalUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setCurrentPortalUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  }
}
