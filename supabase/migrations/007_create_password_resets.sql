-- Create password_resets table
CREATE TABLE IF NOT EXISTS public.password_resets (
  id text PRIMARY KEY,
  email text NOT NULL,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets (token);
