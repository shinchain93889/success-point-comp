-- Include all verification display fields (name, father, mother, mobile, course, subject, photo, marks, grade).
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mobile_no TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS marks TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS grade TEXT;

CREATE OR REPLACE FUNCTION public.get_public_certificate(p_identifier TEXT)
RETURNS TABLE (
    id UUID,
    roll_no TEXT,
    student_name TEXT,
    father_name TEXT,
    mother_name TEXT,
    mobile_no TEXT,
    course TEXT,
    session TEXT,
    start_date DATE,
    end_date DATE,
    course_status TEXT,
    certificate_url TEXT,
    certificate_no TEXT,
    marks TEXT,
    grade TEXT,
    subject TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT s.id, s.roll_no, s.student_name, s.father_name, s.mother_name, s.mobile_no,
           s.course, s.session, s.start_date, s.end_date, s.course_status, s.certificate_url,
           s.certificate_no, s.marks, s.grade, s.subject,
           COALESCE(s.profile_picture_url, s.photo_url) AS profile_picture_url, s.created_at
    FROM public.students AS s
    WHERE lower(s.roll_no) = lower(trim(p_identifier))
       OR lower(s.certificate_no) = lower(trim(p_identifier))
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_certificate(TEXT) TO anon, authenticated;
