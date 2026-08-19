-- Safe to run twice.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingOptInAt" TIMESTAMP(3);

-- Everyone who already signed up is treated as verified.
--
-- Verification was never enforced and the sending was commented out, so every
-- existing account has emailVerified = false through no fault of its own.
-- Switching enforcement on without this would hide all twenty-four real
-- profiles from the directory on the same day the site launched.
--
-- Deliberately NOT a blanket marketing opt-in. Consent has to be given, and
-- nobody has been asked yet — so existing accounts stay opted out until they
-- say otherwise. A list of twenty-four who agreed is worth more than a list of
-- twenty-four who did not.
UPDATE "User" SET "emailVerified" = true WHERE "createdAt" < NOW();
