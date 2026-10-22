-- =======================================================
-- SUCCESS POINT CERTIFICATE & AUTHENTICATION PORTAL SCHEMA
-- Execute this SQL in your Supabase SQL Editor
-- =======================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- 1. PROFILES TABLE (User Roles & Access Control)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    roll_no TEXT,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_roll_no ON public.profiles(roll_no);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- -------------------------------------------------------
-- 2. STUDENTS TABLE (Student Records & Certificate Details)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT,
    course TEXT NOT NULL,
    session TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    mobile_no TEXT,
    course_status TEXT NOT NULL DEFAULT 'pending' CHECK (course_status IN ('pending', 'completed')),
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration helpers if table already exists in Supabase:
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mobile_no TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS end_date DATE;

-- Clean up duplicate roll_no entries before adding UNIQUE constraint
DELETE FROM public.students a USING public.students b
WHERE a.created_at < b.created_at AND a.roll_no = b.roll_no;

-- Ensure UNIQUE constraint on roll_no for ON CONFLICT clause
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'students_roll_no_key'
    ) THEN
        ALTER TABLE public.students ADD CONSTRAINT students_roll_no_key UNIQUE (roll_no);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_roll_no_unique ON public.students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_student_name ON public.students(student_name);
CREATE INDEX IF NOT EXISTS idx_students_course_status ON public.students(course_status);

-- -------------------------------------------------------
-- 3. AUDIT LOGS TABLE (Verification & System Logs)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- -------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ) OR auth.uid() = id
    );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ) OR auth.uid() = id
    );

-- STUDENTS POLICIES
DROP POLICY IF EXISTS "Public read access for certificate verification" ON public.students;
CREATE POLICY "Public read access for certificate verification" ON public.students
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify student records" ON public.students;
DROP POLICY IF EXISTS "Allow write access for student records" ON public.students;
CREATE POLICY "Allow write access for student records" ON public.students
    FOR ALL USING (true) WITH CHECK (true);

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- -------------------------------------------------------
-- 5. TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, roll_no)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'student'),
        COALESCE(new.raw_user_meta_data->>'roll_no', new.raw_user_meta_data->>'student_id')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        roll_no = COALESCE(EXCLUDED.roll_no, public.profiles.roll_no);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- 6. STORAGE BUCKET CONFIGURATION FOR CERTIFICATES
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public read access to certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admin manage certificates" ON storage.objects;

CREATE POLICY "Public read access to certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Admin upload certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates');
CREATE POLICY "Admin manage certificates" ON storage.objects FOR ALL USING (bucket_id = 'certificates');

-- -------------------------------------------------------
-- 7. SEED DATA & SAMPLE INSERT (INCLUDES START/END DATES)
-- -------------------------------------------------------
INSERT INTO public.students (roll_no, student_name, father_name, mother_name, course, session, start_date, end_date, mobile_no, course_status, certificate_url)
VALUES 
('10101', 'Rahul Sharma', 'Vijay Sharma', 'Sunita Sharma', 'Diploma in Computer Application (DCA)', '2023-2024', '2023-07-01', '2024-06-30', '+91 9876543210', 'completed', NULL),
('10102', 'Priya Patel', 'Ramesh Patel', 'Geeta Patel', 'Post Graduate Diploma in Computer Application (PGDCA)', '2023-2024', '2023-08-01', '2024-07-31', '+91 9876543211', 'pending', NULL),
('10103', 'Amit Kumar', 'Suresh Kumar', 'Kavita Kumar', 'Advanced Diploma in Financial Accounting (ADFA)', '2023-2024', '2023-06-01', '2024-05-31', '+91 9876543212', 'completed', NULL),
('TEST001', 'Test Student', 'Test Father', 'Test Mother', 'DCA', '2023-2024', '2023-07-01', '2024-06-30', '+91 9999999999', 'pending', NULL)
ON CONFLICT (roll_no) DO UPDATE SET
    mother_name = EXCLUDED.mother_name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    mobile_no = EXCLUDED.mobile_no,
    course_status = EXCLUDED.course_status;

SELECT * FROM public.students;
