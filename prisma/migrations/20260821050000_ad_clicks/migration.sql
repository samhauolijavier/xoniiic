-- Safe to run twice.
--
-- Who clicked which ad. First-party: it is read only inside the admin screen,
-- so Spencer can follow up on his own affiliate links himself. It is never
-- handed to an advertiser — they get counts.
--
-- Cascades on both sides. If a member deletes their account, their clicks go
-- with them; nobody should keep a record of what somebody was interested in
-- after they have left.
CREATE TABLE IF NOT EXISTS "AdClick" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdClick_adId_createdAt_idx" ON "AdClick"("adId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdClick_userId_idx" ON "AdClick"("userId");

DO $$ BEGIN
  ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_adId_fkey"
    FOREIGN KEY ("adId") REFERENCES "AdSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
