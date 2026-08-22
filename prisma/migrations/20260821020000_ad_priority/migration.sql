-- Safe to run twice.
--
-- Higher shows first. Ads sharing a priority rotate between themselves, so two
-- advertisers on the same tier get equal share instead of one sitting under the
-- other forever because it happened to be uploaded second.
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
