-- Disable Row Level Security for email_verifications
ALTER TABLE IF EXISTS public.email_verifications DISABLE ROW LEVEL SECURITY;
