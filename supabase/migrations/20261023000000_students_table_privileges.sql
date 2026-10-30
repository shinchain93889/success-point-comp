-- Restore the authenticated table privileges required by the admin student
-- management UI. RLS policies still restrict writes to admins.
REVOKE ALL ON TABLE public.students FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.students TO authenticated;
