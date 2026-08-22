-- Safe to run twice.
--
-- Who an ad is for: "all", "seeker", or "employer". The two sides of this
-- marketplace want opposite advertising — a course affiliate wants freelancers,
-- a CRM affiliate wants the people hiring them — and showing each side the
-- other's ads wastes the slot and the click.
--
-- Defaults to "all" so every ad that already exists keeps showing to everyone.
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT 'all';
