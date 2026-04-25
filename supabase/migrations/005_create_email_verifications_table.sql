-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT,
    token TEXT NOT NULL,
    source_of_creation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Indices for faster lookup
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON public.email_verifications (token);
