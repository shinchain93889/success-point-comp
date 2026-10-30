-- Apply this migration to existing Supabase projects before deploying the app changes.
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS certificate_no TEXT;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin() OR (auth.uid() = id AND role = 'student' AND roll_no IS NULL));
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read access for certificate verification" ON public.students;
DROP POLICY IF EXISTS "Admins can read student records" ON public.students;
CREATE POLICY "Admins can read student records" ON public.students FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Students can read own record" ON public.students;
CREATE POLICY "Students can read own record" ON public.students FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'student'
          AND lower(p.roll_no) = lower(public.students.roll_no)
    )
);
DROP POLICY IF EXISTS "Admins can modify student records" ON public.students;
DROP POLICY IF EXISTS "Allow write access for student records" ON public.students;
CREATE POLICY "Admins can modify student records" ON public.students FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON TABLE public.students FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.students TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_certificate(p_identifier TEXT)
RETURNS TABLE (
    id UUID, roll_no TEXT, student_name TEXT, father_name TEXT, course TEXT,
    session TEXT, start_date DATE, end_date DATE, course_status TEXT,
    certificate_url TEXT, certificate_no TEXT, created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT s.id, s.roll_no, s.student_name, s.father_name, s.course, s.session,
           s.start_date, s.end_date, s.course_status, s.certificate_url,
           s.certificate_no, s.created_at
    FROM public.students s
    WHERE lower(s.roll_no) = lower(trim(p_identifier))
       OR lower(s.certificate_no) = lower(trim(p_identifier))
    LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_certificate(TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "Public read access to certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admin manage certificates" ON storage.objects;
CREATE POLICY "Public read access to certificates" ON storage.objects FOR SELECT
    USING (bucket_id = 'certificates');
CREATE POLICY "Admin manage certificates" ON storage.objects FOR ALL
    USING (bucket_id = 'certificates' AND public.is_admin())
    WITH CHECK (bucket_id = 'certificates' AND public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, roll_no)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'student', NULL)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
