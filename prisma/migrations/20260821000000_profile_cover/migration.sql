-- Safe to run twice.
--
-- Nullable with no default on purpose. Null means "no banner", and the profile
-- renders no banner area at all rather than a placeholder — an empty grey strip
-- announces the gap instead of hiding it, and the profiles that would show one
-- are the ones that can least afford another visible hole.
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
