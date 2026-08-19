-- Safe to run twice. See the resources migration for why.
DO $$ BEGIN
  CREATE TYPE "TestimonialState" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "roleTitle" TEXT,
    "company" TEXT,
    "placedSince" TIMESTAMP(3),
    "consentPublic" BOOLEAN NOT NULL DEFAULT true,
    "state" "TestimonialState" NOT NULL DEFAULT 'pending',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Testimonial_state_createdAt_idx" ON "Testimonial"("state", "createdAt");
CREATE INDEX IF NOT EXISTS "Testimonial_userId_idx" ON "Testimonial"("userId");

DO $$ BEGIN
  ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "placedBadgeAt" TIMESTAMP(3);
