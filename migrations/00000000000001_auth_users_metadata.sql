-- Ensure auth.users has raw_user_meta_data and timestamp columns
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
