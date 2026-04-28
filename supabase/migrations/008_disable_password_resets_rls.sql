-- Disable Row Level Security for password_resets
ALTER TABLE IF EXISTS public.password_resets DISABLE ROW LEVEL SECURITY;
