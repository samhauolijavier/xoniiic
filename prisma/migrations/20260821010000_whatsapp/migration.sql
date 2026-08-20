-- Safe to run twice.
--
-- A way to carry a conversation on outside the platform, when both people want
-- to. Nullable, and shown only to signed-in visitors: a phone number on a page
-- open to the whole internet is a number that gets scraped and sold, and that
-- harm lands on the member rather than on the platform.
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
