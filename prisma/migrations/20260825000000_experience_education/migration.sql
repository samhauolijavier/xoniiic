-- Safe to run twice.
--
-- The two things a profile here was missing against a LinkedIn page. Without
-- them a profile reads as a marketplace listing; with them it reads as a
-- career, which is what somebody posting the link wants it to be.
CREATE TABLE IF NOT EXISTS "WorkExperience" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    -- "2024-03". Text rather than a date: the day is noise, and a DateTime
    -- forces a precision nobody remembers.
    "startMonth" TEXT NOT NULL,
    "endMonth" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT,
    "field" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkExperience_profileId_order_idx" ON "WorkExperience"("profileId", "order");
CREATE INDEX IF NOT EXISTS "Education_profileId_order_idx" ON "Education"("profileId", "order");

DO $$ BEGIN
  ALTER TABLE "WorkExperience" ADD CONSTRAINT "WorkExperience_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "SeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "SeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
