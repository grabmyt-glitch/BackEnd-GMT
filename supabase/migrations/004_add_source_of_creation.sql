-- Add source_of_creation to users table
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS source_of_creation TEXT;

-- Add source_of_creation to email_verifications table
ALTER TABLE IF EXISTS public.email_verifications 
ADD COLUMN IF NOT EXISTS source_of_creation TEXT;
