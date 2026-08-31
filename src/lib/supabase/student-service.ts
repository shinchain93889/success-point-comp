import { createClient, isSupabaseConfigured } from './client';
import { StudentRecord } from '@/lib/types/portal';
import {
  getStoredStudents,
  saveStoredStudents,
  addStoredStudent,
  updateStoredStudent,
  deleteStoredStudent,
} from './mock-data';

// Helper to upload certificate file to Supabase storage bucket 'certificates'
export async function uploadCertificateFile(file: File): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase credentials not set. Simulating file upload URL.');
    return URL.createObjectURL(file);
  }

  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop() || 'file';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `certificates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading certificate to Supabase storage:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Upload certificate failed:', err);
    return null;
  }
}

// Helper to normalize Supabase row to StudentRecord
function normalizeStudentRow(item: any): StudentRecord {
  const rollNo = item.roll_no || item.roll_number || item.student_id || '';
  const name = item.student_name || item.name || '';
  const certUrl = item.certificate_url || item.pdf_url || null;
  const mobileNo = item.mobile_no || item.phone || '';
  const status = item.course_status === 'completed' ? 'completed' : 'pending';

  return {
    id: item.id,
    roll_no: rollNo,
    student_name: name,
    father_name: item.father_name || '',
    course: item.course || '',
    session: item.session || '',
    start_date: item.start_date || null,
    end_date: item.end_date || null,
    mobile_no: mobileNo,
    course_status: status,
    certificate_url: certUrl,
    created_at: item.created_at || new Date().toISOString(),
    student_id: item.student_id || rollNo,
    roll_number: item.roll_number || rollNo,
    name: name,
    certificate_no: item.certificate_no || `SP-${rollNo}`,
    issue_date: item.issue_date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    phone: mobileNo,
    pdf_url: certUrl,
  };
}

// Fetch all students from Supabase or fallback
export async function fetchStudents(): Promise<StudentRecord[]> {
  if (!isSupabaseConfigured()) {
    return getStoredStudents();
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch students from Supabase:', error?.message);
      return getStoredStudents();
    }

    const localStudents = getStoredStudents();
    const normalized = data.map((row) => {
      const norm = normalizeStudentRow(row);
      const local = localStudents.find(
        (l) => l.id === norm.id || (l.roll_no && l.roll_no === norm.roll_no)
      );
      if (local) {
        if (local.mobile_no && !norm.mobile_no) {
          norm.mobile_no = local.mobile_no;
        }
        if (local.start_date && !norm.start_date) {
          norm.start_date = local.start_date;
        }
        if (local.end_date && !norm.end_date) {
          norm.end_date = local.end_date;
        }
      }
      return norm;
    });

    saveStoredStudents(normalized);
    return normalized;
  } catch (err) {
    console.error('Fetch students error:', err);
    return getStoredStudents();
  }
}

// Fetch single student by Roll Number from Supabase or fallback
export async function fetchStudentByRollNo(rollNo: string): Promise<StudentRecord | null> {
  const cleanRollNo = rollNo.trim();
  if (!cleanRollNo) return null;

  if (!isSupabaseConfigured()) {
    const localStudents = getStoredStudents();
    return (
      localStudents.find(
        (s) =>
          (s.roll_no && s.roll_no.toLowerCase() === cleanRollNo.toLowerCase()) ||
          (s.roll_number && s.roll_number.toLowerCase() === cleanRollNo.toLowerCase()) ||
          (s.student_id && s.student_id.toLowerCase() === cleanRollNo.toLowerCase()) ||
          (s.certificate_no && s.certificate_no.toLowerCase() === cleanRollNo.toLowerCase())
      ) || null
    );
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`roll_no.eq.${cleanRollNo},roll_number.eq.${cleanRollNo},student_id.eq.${cleanRollNo},certificate_no.eq.${cleanRollNo}`)
      .limit(1);

    if (error || !data || data.length === 0) {
      const localStudents = getStoredStudents();
      return (
        localStudents.find(
          (s) =>
            (s.roll_no && s.roll_no.toLowerCase() === cleanRollNo.toLowerCase()) ||
            (s.roll_number && s.roll_number.toLowerCase() === cleanRollNo.toLowerCase()) ||
            (s.student_id && s.student_id.toLowerCase() === cleanRollNo.toLowerCase()) ||
            (s.certificate_no && s.certificate_no.toLowerCase() === cleanRollNo.toLowerCase())
        ) || null
      );
    }

    const fetched = normalizeStudentRow(data[0]);
    const localStudents = getStoredStudents();
    const local = localStudents.find(
      (l) => l.id === fetched.id || (l.roll_no && l.roll_no === fetched.roll_no)
    );
    if (local) {
      if (local.mobile_no && !fetched.mobile_no) fetched.mobile_no = local.mobile_no;
      if (local.start_date && !fetched.start_date) fetched.start_date = local.start_date;
      if (local.end_date && !fetched.end_date) fetched.end_date = local.end_date;
    }
    return fetched;
  } catch (err) {
    console.error('Fetch student by roll no error:', err);
    const localStudents = getStoredStudents();
    return (
      localStudents.find(
        (s) =>
          (s.roll_no && s.roll_no.toLowerCase() === cleanRollNo.toLowerCase()) ||
          (s.roll_number && s.roll_number.toLowerCase() === cleanRollNo.toLowerCase()) ||
          (s.student_id && s.student_id.toLowerCase() === cleanRollNo.toLowerCase()) ||
          (s.certificate_no && s.certificate_no.toLowerCase() === cleanRollNo.toLowerCase())
      ) || null
    );
  }
}

// Add a new student record to Supabase & localStorage
export async function createStudent(
  studentData: {
    roll_no: string;
    student_name: string;
    father_name: string;
    course: string;
    session: string;
    start_date?: string | null;
    end_date?: string | null;
    mobile_no?: string | null;
    course_status?: 'pending' | 'completed';
    certificate_url?: string | null;
  },
  certificateFile?: File | null
): Promise<StudentRecord> {
  let certUrl = studentData.certificate_url || null;

  if (certificateFile) {
    const uploadedUrl = await uploadCertificateFile(certificateFile);
    if (uploadedUrl) {
      certUrl = uploadedUrl;
    }
  }

  const rollNo = studentData.roll_no;
  const name = studentData.student_name;
  const issueDate = new Date().toISOString().split('T')[0];
  const courseStatus = studentData.course_status || 'pending';
  const mobileNo = studentData.mobile_no || '';

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();

      const fullPayload: any = {
        roll_no: rollNo,
        student_name: name,
        father_name: studentData.father_name,
        course: studentData.course,
        session: studentData.session,
        start_date: studentData.start_date || null,
        end_date: studentData.end_date || null,
        mobile_no: mobileNo,
        course_status: courseStatus,
        certificate_url: certUrl,
      };

      let insertRes = await supabase
        .from('students')
        .insert([fullPayload])
        .select()
        .single();

      if (insertRes.error && insertRes.error.message.includes('column')) {
        console.warn('Primary schema insert failed, trying legacy table columns:', insertRes.error.message);
        const legacyPayload = {
          student_id: rollNo,
          roll_number: rollNo,
          name: name,
          father_name: studentData.father_name,
          course: studentData.course,
          session: studentData.session,
          certificate_no: `SP-2024-${rollNo}`,
          issue_date: issueDate,
          pdf_url: certUrl,
        };
        insertRes = await supabase
          .from('students')
          .insert([legacyPayload])
          .select()
          .single();
      }

      if (insertRes.error) {
        console.error('Supabase insert error:', insertRes.error);
        throw new Error(`Supabase Error (${insertRes.error.code}): ${insertRes.error.message}`);
      } else if (insertRes.data) {
        const createdRecord = normalizeStudentRow(insertRes.data);
        addStoredStudent(createdRecord);
        return createdRecord;
      }
    } catch (e: any) {
      console.error('Supabase insert exception:', e);
      if (e.message && e.message.includes('Supabase Error')) {
        throw e;
      }
    }
  }

  // Local storage fallback
  const localAdded = addStoredStudent({
    student_id: rollNo,
    roll_number: rollNo,
    name: name,
    father_name: studentData.father_name,
    course: studentData.course,
    session: studentData.session,
    start_date: studentData.start_date || null,
    end_date: studentData.end_date || null,
    mobile_no: mobileNo,
    course_status: courseStatus,
    certificate_no: `SP-2024-${rollNo}`,
    issue_date: issueDate,
    pdf_url: certUrl,
    roll_no: rollNo,
    student_name: name,
    certificate_url: certUrl,
  });

  return normalizeStudentRow(localAdded);
}

// Update student record in Supabase & localStorage
export async function updateStudent(
  id: string,
  updates: Partial<StudentRecord>,
  certificateFile?: File | null
): Promise<StudentRecord | null> {
  let certUrl = updates.certificate_url;

  if (certificateFile) {
    const uploadedUrl = await uploadCertificateFile(certificateFile);
    if (uploadedUrl) {
      certUrl = uploadedUrl;
    }
  }

  const rollNo = updates.roll_no || updates.roll_number || updates.student_id;
  const name = updates.student_name || updates.name;

  // Build clean primary payload matching Supabase table schema
  const primaryPayload: any = {};
  if (rollNo) primaryPayload.roll_no = rollNo;
  if (name) primaryPayload.student_name = name;
  if (updates.father_name !== undefined) primaryPayload.father_name = updates.father_name;
  if (updates.course !== undefined) primaryPayload.course = updates.course;
  if (updates.session !== undefined) primaryPayload.session = updates.session;
  if (updates.start_date !== undefined) primaryPayload.start_date = updates.start_date;
  if (updates.end_date !== undefined) primaryPayload.end_date = updates.end_date;
  if (updates.mobile_no !== undefined) primaryPayload.mobile_no = updates.mobile_no;
  if (updates.course_status !== undefined) primaryPayload.course_status = updates.course_status;
  if (certUrl !== undefined) primaryPayload.certificate_url = certUrl;

  // Secondary Fallback Payload (excluding dates/mobile if table schema does not include them)
  const fallbackPayload: any = {};
  if (rollNo) fallbackPayload.roll_no = rollNo;
  if (name) fallbackPayload.student_name = name;
  if (updates.father_name !== undefined) fallbackPayload.father_name = updates.father_name;
  if (updates.course !== undefined) fallbackPayload.course = updates.course;
  if (updates.session !== undefined) fallbackPayload.session = updates.session;
  if (updates.course_status !== undefined) fallbackPayload.course_status = updates.course_status;
  if (certUrl !== undefined) fallbackPayload.certificate_url = certUrl;

  // Legacy Schema Payload
  const legacyPayload: any = {};
  if (rollNo) {
    legacyPayload.roll_number = rollNo;
    legacyPayload.student_id = rollNo;
  }
  if (name) legacyPayload.name = name;
  if (updates.father_name !== undefined) legacyPayload.father_name = updates.father_name;
  if (updates.course !== undefined) legacyPayload.course = updates.course;
  if (updates.session !== undefined) legacyPayload.session = updates.session;
  if (updates.course_status !== undefined) legacyPayload.course_status = updates.course_status;
  if (certUrl !== undefined) legacyPayload.pdf_url = certUrl;

  let supabaseUpdatedRecord: StudentRecord | null = null;
  let lastError: any = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const cleanId = (id || '').trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      const targetRoll = rollNo || cleanId;

      // Only try valid schema payloads
      const payloadsToTry = [primaryPayload, fallbackPayload];

      for (const payload of payloadsToTry) {
        if (Object.keys(payload).length === 0) continue;

        // 1. Try update by UUID primary key
        if (isUuid) {
          const res = await supabase
            .from('students')
            .update(payload)
            .eq('id', cleanId)
            .select()
            .maybeSingle();

          if (res.data) {
            supabaseUpdatedRecord = normalizeStudentRow(res.data);
            break;
          }
          if (res.error) lastError = res.error;
        }

        // 2. Try update by roll_no
        if (targetRoll) {
          const resRoll = await supabase
            .from('students')
            .update(payload)
            .eq('roll_no', targetRoll)
            .select()
            .maybeSingle();

          if (resRoll.data) {
            supabaseUpdatedRecord = normalizeStudentRow(resRoll.data);
            break;
          }
          if (resRoll.error) lastError = resRoll.error;
        }
      }

      // 3. If update matched 0 rows, try upserting record into Supabase
      if (!supabaseUpdatedRecord && targetRoll) {
        const fullUpsert: any = {
          roll_no: targetRoll,
          student_name: name || updates.student_name || 'Student',
          father_name: updates.father_name || '',
          course: updates.course || 'Diploma in Computer Application (DCA)',
          session: updates.session || '2023-2024',
          start_date: updates.start_date || null,
          end_date: updates.end_date || null,
          mobile_no: updates.mobile_no || '',
          course_status: updates.course_status || 'pending',
          certificate_url: certUrl || null,
        };

        const upsertRes = await supabase
          .from('students')
          .upsert([fullUpsert], { onConflict: 'roll_no' })
          .select()
          .maybeSingle();

        if (upsertRes.data) {
          supabaseUpdatedRecord = normalizeStudentRow(upsertRes.data);
        } else if (upsertRes.error) {
          lastError = upsertRes.error;
        }
      }

      if (!supabaseUpdatedRecord && lastError) {
        console.error('Supabase update failed:', lastError?.message || lastError);
      }
    } catch (e: any) {
      console.error('Supabase update exception:', e?.message || e);
      lastError = e;
    }
  }

  // Update local storage to keep state in sync
  const updatedLocal = updateStoredStudent(id, {
    ...updates,
    ...(supabaseUpdatedRecord || {}),
    ...(certUrl ? { certificate_url: certUrl, pdf_url: certUrl } : {}),
  });

  if (isSupabaseConfigured() && !supabaseUpdatedRecord) {
    const errMsg = lastError?.message || (typeof lastError === 'string' ? lastError : '');
    const isRlsError =
      !lastError ||
      errMsg.toLowerCase().includes('row-level security') ||
      errMsg.toLowerCase().includes('violates') ||
      lastError?.code === '42501';

    if (isRlsError) {
      throw new Error(
        'Supabase RLS Policy Error: Row Level Security is blocking updates on table "students". Please run the SQL policy in schema.sql in your Supabase SQL Editor.'
      );
    }

    throw new Error(
      errMsg || `Failed to update or create student record for Roll No '${rollNo || id}' in Supabase database.`
    );
  }

  return updatedLocal ? normalizeStudentRow(updatedLocal) : supabaseUpdatedRecord;
}

// Delete student record from Supabase & localStorage
export async function deleteStudent(id: string): Promise<boolean> {
  const cleanId = (id || '').trim();
  if (!cleanId) return false;

  let supabaseDeleted = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

      if (isUuid) {
        const { error, count } = await supabase
          .from('students')
          .delete({ count: 'exact' })
          .eq('id', cleanId);

        if (!error && count !== null && count > 0) {
          supabaseDeleted = true;
        } else if (error) {
          console.error('Supabase delete by id error:', error.message);
        }
      }

      // Fallback: If not UUID or primary delete by ID didn't match any row, try deleting by standard roll_no column
      if (!supabaseDeleted) {
        const { error, count } = await supabase
          .from('students')
          .delete({ count: 'exact' })
          .eq('roll_no', cleanId);

        if (!error && count !== null && count > 0) {
          supabaseDeleted = true;
        } else if (error && error.message.includes('column')) {
          // Legacy schema table columns if roll_no column does not exist
          const legacyRes = await supabase
            .from('students')
            .delete({ count: 'exact' })
            .or(`student_id.eq.${cleanId},roll_number.eq.${cleanId}`);

          if (!legacyRes.error && legacyRes.count !== null && legacyRes.count > 0) {
            supabaseDeleted = true;
          }
        }
      }

      if (!supabaseDeleted) {
        console.warn(`Supabase delete attempted for '${cleanId}' but no matching records were removed in Supabase database.`);
      }
    } catch (e: any) {
      console.error('Supabase delete exception:', e);
    }
  }

  // Delete from local storage fallback as well
  const localDeleted = deleteStoredStudent(cleanId);

  return supabaseDeleted || localDeleted;
}

