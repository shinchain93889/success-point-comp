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
      console.warn('Error uploading certificate to Supabase storage:', uploadError.message);
      return URL.createObjectURL(file);
    }

    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || URL.createObjectURL(file);
  } catch (err) {
    console.warn('Upload certificate failed, falling back to blob URL:', err);
    return URL.createObjectURL(file);
  }
}

// Helper to upload student photo image to Supabase storage bucket 'certificates' or return Data URL fallback
export async function uploadStudentPhotoFile(file: File): Promise<string | null> {
  if (!file) return null;
  if (typeof window !== 'undefined') {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (!isSupabaseConfigured()) {
        return dataUrl;
      }

      try {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `student_photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.warn('Supabase photo upload error, using Data URL:', uploadError.message);
          return dataUrl;
        }

        const { data: urlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(filePath);

        return urlData?.publicUrl || dataUrl;
      } catch (e) {
        console.warn('Supabase photo upload exception, using Data URL:', e);
        return dataUrl;
      }
    } catch {
      return URL.createObjectURL(file);
    }
  }
  return null;
}

// Helper to normalize Supabase row to StudentRecord
function normalizeStudentRow(item: any): StudentRecord {
  const rollNo = item.roll_no || item.roll_number || item.student_id || '';
  const name = item.student_name || item.name || '';
  const certUrl = item.certificate_url || item.pdf_url || null;
  const mobileNo = item.mobile_no || item.phone || '';
  const status = item.course_status === 'completed' ? 'completed' : 'pending';
  const photoUrl = item.profile_picture_url || item.photo_url || item.student_image || item.avatar_url || null;

  return {
    id: item.id,
    roll_no: rollNo,
    student_name: name,
    father_name: item.father_name || '',
    mother_name: item.mother_name || item.motherName || '',
    course: item.course || '',
    session: item.session || '',
    start_date: item.start_date || null,
    end_date: item.end_date || null,
    mobile_no: mobileNo,
    course_status: status,
    certificate_url: certUrl,
    profile_picture_url: photoUrl,
    photo_url: photoUrl,
    student_image: photoUrl,
    created_at: item.created_at || new Date().toISOString(),
    student_id: item.student_id || rollNo,
    roll_number: item.roll_number || rollNo,
    name: name,
    certificate_no: item.certificate_no || `SP-${rollNo}`,
    issue_date: item.issue_date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    phone: mobileNo,
    pdf_url: certUrl,
    enrollment_no: item.enrollment_no || undefined,
    duration: item.duration || item.session || undefined,
    subject: item.subject || undefined,
    marks: item.marks || undefined,
    grade: item.grade || undefined,
  };
}

// Fetch all students from Supabase or fallback
export async function fetchStudents(): Promise<StudentRecord[]> {
  const localStudents = getStoredStudents();

  if (!isSupabaseConfigured()) {
    return localStudents;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch students from Supabase (using local records):', error.message);
      return localStudents;
    }

    // If Supabase returned no rows (e.g. empty table or RLS blocking anon read),
    // preserve existing local storage records instead of wiping them out!
    if (!data || data.length === 0) {
      return localStudents;
    }

    const normalized = data.map((row) => {
      const norm = normalizeStudentRow(row);
      const local = localStudents.find(
        (l) => l.id === norm.id || (l.roll_no && norm.roll_no && l.roll_no.toLowerCase() === norm.roll_no.toLowerCase())
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
        if (local.mother_name && !norm.mother_name) {
          norm.mother_name = local.mother_name;
        }
        if (local.subject && !norm.subject) {
          norm.subject = local.subject;
        }
        if (local.marks && !norm.marks) {
          norm.marks = local.marks;
        }
        if (local.grade && !norm.grade) {
          norm.grade = local.grade;
        }
      }
      return norm;
    });

    // Also preserve any locally added students that are not yet synced to Supabase
    const nonSyncedLocals = localStudents.filter(
      (ls) =>
        !normalized.some(
          (ns) =>
            (ns.roll_no && ls.roll_no && ns.roll_no.toLowerCase() === ls.roll_no.toLowerCase()) ||
            (ns.id && ls.id && ns.id === ls.id)
        )
    );

    const merged = [...normalized, ...nonSyncedLocals];
    saveStoredStudents(merged);
    return merged;
  } catch (err: any) {
    const errMsg = err?.message || (typeof err === 'string' ? err : '');
    console.warn('Fetch students error (falling back to local):', errMsg);
    return localStudents;
  }
}

// Fetch single student by Roll Number from Supabase or fallback
export async function fetchStudentByRollNo(rollNo: string): Promise<StudentRecord | null> {
  const cleanRollNo = rollNo.trim();
  if (!cleanRollNo) return null;

  const toPublicCertificate = (row: any): StudentRecord => ({
    id: row.id,
    roll_no: row.roll_no || row.roll_number || row.student_id || '',
    student_name: row.student_name || row.name || '',
    father_name: row.father_name || '',
    course: row.course || '',
    session: row.session || '',
    course_status: row.course_status === 'completed' ? 'completed' : 'pending',
    certificate_url: row.certificate_url || row.pdf_url || null,
    created_at: row.created_at || '',
    certificate_no: row.certificate_no || `SP-${row.roll_no || row.roll_number || row.student_id || ''}`,
    issue_date: row.issue_date || row.created_at?.split('T')[0] || undefined,
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    enrollment_no: row.enrollment_no || undefined,
    duration: row.duration || undefined,
    subject: row.subject || row.course || undefined,
    marks: row.marks || undefined,
    grade: row.grade || undefined,
    profile_picture_url: row.profile_picture_url || row.photo_url || row.student_image || null,
  });

  const findLocalCertificate = () => {
    const row = getStoredStudents().find((s) =>
      [s.roll_no, s.roll_number, s.student_id, s.certificate_no]
        .some((value) => value?.toLowerCase() === cleanRollNo.toLowerCase())
    );
    return row ? toPublicCertificate(row) : null;
  };

  if (!isSupabaseConfigured()) {
    return findLocalCertificate();
  }

  try {
    const supabase = createClient();

    // 1. Try public RPC function
    const { data, error } = await supabase.rpc('get_public_certificate', { p_identifier: cleanRollNo });

    if (!error && data?.[0]) {
      return toPublicCertificate(data[0]);
    }

    // 2. Fallback to direct students query
    const { data: tableData } = await supabase
      .from('students')
      .select('*')
      .or(`roll_no.ilike.${cleanRollNo},certificate_no.ilike.${cleanRollNo}`)
      .limit(1);

    if (tableData?.[0]) {
      return toPublicCertificate(tableData[0]);
    }

    // 3. Fallback to local storage
    return findLocalCertificate();
  } catch (err: any) {
    console.warn('Supabase fetchStudentByRollNo notice (using local fallback):', err?.message || err);
    return findLocalCertificate();
  }
}

// Add a new student record to Supabase & localStorage
export async function createStudent(
  studentData: {
    roll_no: string;
    student_name: string;
    father_name: string;
    mother_name?: string | null;
    course: string;
    subject?: string | null;
    session: string;
    start_date?: string | null;
    end_date?: string | null;
    mobile_no?: string | null;
    course_status?: 'pending' | 'completed';
    certificate_url?: string | null;
    profile_picture_url?: string | null;
    photo_url?: string | null;
    marks?: string | null;
    grade?: string | null;
  },
  certificateFile?: File | null,
  photoFile?: File | null
): Promise<StudentRecord> {
  let certUrl = studentData.certificate_url || null;
  let photoUrl = studentData.profile_picture_url || studentData.photo_url || null;

  if (certificateFile) {
    const uploadedUrl = await uploadCertificateFile(certificateFile);
    if (uploadedUrl) {
      certUrl = uploadedUrl;
    }
  }

  if (photoFile) {
    const uploadedPhoto = await uploadStudentPhotoFile(photoFile);
    if (uploadedPhoto) {
      photoUrl = uploadedPhoto;
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
        mother_name: studentData.mother_name || null,
        course: studentData.course,
        subject: studentData.subject || studentData.course || null,
        session: studentData.session,
        start_date: studentData.start_date || null,
        end_date: studentData.end_date || null,
        mobile_no: mobileNo,
        course_status: courseStatus,
        certificate_url: certUrl,
        profile_picture_url: photoUrl,
        marks: studentData.marks || null,
        grade: studentData.grade || null,
      };

      // Try upserting first to handle existing roll numbers gracefully
      let insertRes = await supabase
        .from('students')
        .upsert([fullPayload], { onConflict: 'roll_no' })
        .select()
        .maybeSingle();

      // Fallback 1: If full payload fails due to missing table columns, try standard payload
      if (insertRes.error) {
        const errMsg = insertRes.error.message || JSON.stringify(insertRes.error);
        if (errMsg.toLowerCase().includes('column') || insertRes.error.code === 'PGRST204') {
          console.warn('Full payload failed due to column mismatch, trying standard payload:', errMsg);
          const stdPayload = {
            roll_no: rollNo,
            student_name: name,
            father_name: studentData.father_name,
            mother_name: studentData.mother_name || null,
            course: studentData.course,
            session: studentData.session,
            course_status: courseStatus,
            certificate_url: certUrl,
          };
          insertRes = await supabase
            .from('students')
            .upsert([stdPayload], { onConflict: 'roll_no' })
            .select()
            .maybeSingle();
        }
      }

      // Fallback 2: If standard payload fails due to legacy schema table column names
      if (insertRes.error) {
        const errMsg = insertRes.error.message || JSON.stringify(insertRes.error);
        if (errMsg.toLowerCase().includes('column') || insertRes.error.code === 'PGRST204') {
          console.warn('Standard payload failed, trying legacy schema payload:', errMsg);
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
            .maybeSingle();
        }
      }

      if (insertRes.data) {
        const createdRecord = normalizeStudentRow(insertRes.data);
        addStoredStudent(createdRecord);
        return createdRecord;
      } else if (insertRes.error) {
        const errDetail = insertRes.error.message || insertRes.error.details || JSON.stringify(insertRes.error);

        const isNetworkError =
          errDetail.toLowerCase().includes('failed to fetch') ||
          errDetail.toLowerCase().includes('fetch failed') ||
          errDetail.toLowerCase().includes('networkerror') ||
          errDetail.toLowerCase().includes('enotfound') ||
          errDetail.toLowerCase().includes('typeerror');

        if (isNetworkError) {
          console.warn('Supabase request failed due to network issue, falling back to local storage:', errDetail);
          // Fall through to local storage below
        } else {
          console.error('Supabase insert/upsert error details:', errDetail);

          if (insertRes.error.code === '23505') {
            throw new Error(`Student record with Roll No '${rollNo}' already exists.`);
          } else if (
            insertRes.error.code === '42501' ||
            errDetail.toLowerCase().includes('row-level security') ||
            errDetail.toLowerCase().includes('permission denied')
          ) {
            throw new Error(
              `Supabase Permission Error: Database is blocking insert on table 'students' (${errDetail}). Please execute the updated supabase/schema.sql in your Supabase SQL Editor to grant table & storage permissions.`
            );
          } else {
            throw new Error(`Supabase Error (${insertRes.error.code || 'UNKNOWN'}): ${errDetail}`);
          }
        }

        if (insertRes.error.code === '42501') {
          throw new Error(
            'Supabase denied access to the students table. Apply the latest Supabase migrations, then sign in again as an admin.'
          );
        }

        console.warn('Supabase insert notice, record saved locally:', errDetail);
      }
    } catch (e: any) {
      if (e?.message && e.message.includes('already exists')) {
        throw e;
      }
      if (e?.message?.includes('Supabase denied access')) {
        throw e;
      }
      console.warn('Supabase create student exception, saved locally:', e?.message || e);
    }
  }

  // Local storage fallback
  const localAdded = addStoredStudent({
    student_id: rollNo,
    roll_number: rollNo,
    name: name,
    father_name: studentData.father_name,
    course: studentData.course,
    subject: studentData.subject || studentData.course,
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
    profile_picture_url: photoUrl,
    photo_url: photoUrl,
    student_image: photoUrl,
    marks: studentData.marks || undefined,
    grade: studentData.grade || undefined,
  });

  return normalizeStudentRow(localAdded);
}

// Update student record in Supabase & localStorage
export async function updateStudent(
  id: string,
  updates: Partial<StudentRecord>,
  certificateFile?: File | null,
  photoFile?: File | null
): Promise<StudentRecord | null> {
  let certUrl = updates.certificate_url;
  let photoUrl = updates.profile_picture_url || updates.photo_url || updates.student_image;

  if (certificateFile) {
    const uploadedUrl = await uploadCertificateFile(certificateFile);
    if (uploadedUrl) {
      certUrl = uploadedUrl;
    }
  }

  if (photoFile) {
    const uploadedPhoto = await uploadStudentPhotoFile(photoFile);
    if (uploadedPhoto) {
      photoUrl = uploadedPhoto;
    }
  }

  const rollNo = updates.roll_no || updates.roll_number || updates.student_id;
  const name = updates.student_name || updates.name;

  // Build clean primary payload matching Supabase table schema
  const primaryPayload: any = {};
  if (rollNo) primaryPayload.roll_no = rollNo;
  if (name) primaryPayload.student_name = name;
  if (updates.father_name !== undefined) primaryPayload.father_name = updates.father_name;
  if (updates.mother_name !== undefined) primaryPayload.mother_name = updates.mother_name;
  if (updates.course !== undefined) primaryPayload.course = updates.course;
  if (updates.subject !== undefined) primaryPayload.subject = updates.subject;
  if (updates.session !== undefined) primaryPayload.session = updates.session;
  if (updates.start_date !== undefined) primaryPayload.start_date = updates.start_date;
  if (updates.end_date !== undefined) primaryPayload.end_date = updates.end_date;
  if (updates.mobile_no !== undefined) primaryPayload.mobile_no = updates.mobile_no;
  if (updates.course_status !== undefined) primaryPayload.course_status = updates.course_status;
  if (updates.marks !== undefined) primaryPayload.marks = updates.marks;
  if (updates.grade !== undefined) primaryPayload.grade = updates.grade;
  if (certUrl !== undefined) primaryPayload.certificate_url = certUrl;
  if (photoUrl !== undefined) primaryPayload.profile_picture_url = photoUrl;

  // Secondary Fallback Payload (excluding dates/mobile if table schema does not include them)
  const fallbackPayload: any = {};
  if (rollNo) fallbackPayload.roll_no = rollNo;
  if (name) fallbackPayload.student_name = name;
  if (updates.father_name !== undefined) fallbackPayload.father_name = updates.father_name;
  if (updates.mother_name !== undefined) fallbackPayload.mother_name = updates.mother_name;
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
          mother_name: updates.mother_name || '',
          course: updates.course || 'Diploma in Computer Application (DCA)',
          session: updates.session || '2023-2024',
          start_date: updates.start_date || null,
          end_date: updates.end_date || null,
          mobile_no: updates.mobile_no || '',
          course_status: updates.course_status || 'pending',
          certificate_url: certUrl || null,
          marks: updates.marks || null,
          grade: updates.grade || null,
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
        const errMsg = lastError?.message || (typeof lastError === 'string' ? lastError : '');
        const isNetworkError =
          errMsg.toLowerCase().includes('failed to fetch') ||
          errMsg.toLowerCase().includes('fetch failed') ||
          errMsg.toLowerCase().includes('networkerror') ||
          errMsg.toLowerCase().includes('enotfound') ||
          lastError?.name === 'TypeError';

        if (!isNetworkError) {
          console.error('Supabase update failed:', errMsg);
        } else {
          console.warn('Supabase update failed due to network issue (using local fallback):', errMsg);
        }
      }
    } catch (e: any) {
      const errMsg = e?.message || (typeof e === 'string' ? e : '');
      const isNetworkError =
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('fetch failed') ||
        errMsg.toLowerCase().includes('networkerror') ||
        errMsg.toLowerCase().includes('enotfound') ||
        e?.name === 'TypeError';

      if (!isNetworkError) {
        console.error('Supabase update exception:', errMsg);
      } else {
        console.warn('Supabase update exception (using local fallback):', errMsg);
      }
      lastError = e;
    }
  }

  // Update local storage to keep state in sync
  const updatedLocal = updateStoredStudent(id, {
    ...updates,
    ...(supabaseUpdatedRecord || {}),
    ...(certUrl ? { certificate_url: certUrl, pdf_url: certUrl } : {}),
    ...(photoUrl ? { profile_picture_url: photoUrl, photo_url: photoUrl, student_image: photoUrl } : {}),
  });

  if (isSupabaseConfigured() && !supabaseUpdatedRecord) {
    const errMsg = lastError?.message || (typeof lastError === 'string' ? lastError : '');
    const isNetworkError =
      !lastError ||
      errMsg.toLowerCase().includes('failed to fetch') ||
      errMsg.toLowerCase().includes('fetch failed') ||
      errMsg.toLowerCase().includes('networkerror') ||
      errMsg.toLowerCase().includes('enotfound') ||
      lastError?.name === 'TypeError';

    if (!isNetworkError) {
      const isRlsError =
        errMsg.toLowerCase().includes('row-level security') ||
        errMsg.toLowerCase().includes('violates') ||
        errMsg.toLowerCase().includes('permission denied') ||
        lastError?.code === '42501';

      if (isRlsError) {
        throw new Error(
          'Supabase Permission Error: Database is blocking updates on table "students". Please execute the updated supabase/schema.sql in your Supabase SQL Editor.'
        );
      }

      throw new Error(
        errMsg || `Failed to update or create student record for Roll No '${rollNo || id}' in Supabase database.`
      );
    } else {
      console.warn('Supabase update failed due to network issue, falling back to local storage:', errMsg);
    }
  }

  return updatedLocal ? normalizeStudentRow(updatedLocal) : supabaseUpdatedRecord;
}

// Delete student record from Supabase & localStorage
export async function deleteStudent(id: string): Promise<boolean> {
  const cleanId = (id || '').trim();
  if (!cleanId) return false;

  let supabaseDeleted = false;
  let isOfflineOrNetworkError = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

      if (isUuid) {
        try {
          const { error, count } = await supabase
            .from('students')
            .delete({ count: 'exact' })
            .eq('id', cleanId);

          if (!error && count !== null && count > 0) {
            supabaseDeleted = true;
          } else if (error) {
            const errMsg = error.message || (typeof error === 'string' ? error : '');
            const isNetErr =
              errMsg.toLowerCase().includes('failed to fetch') ||
              errMsg.toLowerCase().includes('fetch failed') ||
              errMsg.toLowerCase().includes('networkerror') ||
              errMsg.toLowerCase().includes('enotfound') ||
              (error as any)?.name === 'TypeError';

            if (isNetErr) {
              isOfflineOrNetworkError = true;
              console.warn('Supabase delete network notice (using local fallback):', errMsg);
            } else {
              console.warn('Supabase delete by id notice:', errMsg);
            }
          }
        } catch (delErr: any) {
          const errMsg = delErr?.message || (typeof delErr === 'string' ? delErr : '');
          const isNetErr =
            errMsg.toLowerCase().includes('failed to fetch') ||
            errMsg.toLowerCase().includes('fetch failed') ||
            errMsg.toLowerCase().includes('networkerror') ||
            errMsg.toLowerCase().includes('enotfound') ||
            delErr?.name === 'TypeError';

          if (isNetErr) {
            isOfflineOrNetworkError = true;
            console.warn('Supabase delete network notice (using local fallback):', errMsg);
          } else {
            console.warn('Supabase delete by id exception:', delErr);
          }
        }
      }

      // Fallback: If not UUID and network is fine, try deleting by standard roll_no column
      if (!supabaseDeleted && !isOfflineOrNetworkError) {
        try {
          const { error, count } = await supabase
            .from('students')
            .delete({ count: 'exact' })
            .eq('roll_no', cleanId);

          if (!error && count !== null && count > 0) {
            supabaseDeleted = true;
          } else if (error) {
            const errMsg = error.message || '';
            const isNetErr =
              errMsg.toLowerCase().includes('failed to fetch') ||
              errMsg.toLowerCase().includes('fetch failed') ||
              (error as any)?.name === 'TypeError';

            if (isNetErr) {
              isOfflineOrNetworkError = true;
              console.warn('Supabase delete network notice (using local fallback):', errMsg);
            } else if (errMsg.includes('column')) {
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
        } catch (rollErr: any) {
          const errMsg = rollErr?.message || '';
          if (errMsg.toLowerCase().includes('failed to fetch') || rollErr?.name === 'TypeError') {
            isOfflineOrNetworkError = true;
            console.warn('Supabase delete network notice (using local fallback):', errMsg);
          }
        }
      }

      if (!supabaseDeleted && !isOfflineOrNetworkError) {
        console.warn(`Supabase delete attempted for '${cleanId}' but no matching records were removed in Supabase database.`);
      }
    } catch (e: any) {
      const errMsg = e?.message || (typeof e === 'string' ? e : '');
      const isNetErr =
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('fetch failed') ||
        e?.name === 'TypeError';

      if (!isNetErr) {
        console.warn('Supabase delete exception:', errMsg);
      } else {
        console.warn('Supabase delete network exception (using local fallback):', errMsg);
      }
    }
  }

  // Delete from local storage fallback as well
  const localDeleted = deleteStoredStudent(cleanId);

  return supabaseDeleted || localDeleted;
}

