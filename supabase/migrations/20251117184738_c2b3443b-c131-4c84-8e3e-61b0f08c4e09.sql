-- Make last_name optional in profiles table
ALTER TABLE profiles 
ALTER COLUMN last_name DROP NOT NULL;