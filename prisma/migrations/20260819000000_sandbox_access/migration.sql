-- Sandbox access: seats, GCash claims, sponsorships, referrals, quiz attempts.
--
-- Additive only. Nothing here drops, renames or alters an existing table, so
-- it cannot damage the data already live — every statement creates something
-- that does not exist yet.
--
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
-- Then the matching Prisma migration is already committed, so the next change
-- stacks on a known history instead of guessing at the current state.

CREATE TYPE "AccessSource" AS ENUM ('paid', 'earned', 'sponsored', 'referred', 'comped');

CREATE TYPE "PaymentState" AS ENUM ('awaiting_proof', 'awaiting_check', 'verified', 'rejected');

CREATE TABLE "SandboxAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "AccessSource" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "subAccount" TEXT,
    "note" TEXT,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GcashPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 100,
    "proofUrl" TEXT,
    "state" "PaymentState" NOT NULL DEFAULT 'awaiting_proof',
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessId" TEXT,

    CONSTRAINT "GcashPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "invitedId" TEXT NOT NULL,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "rewarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScenarioAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SandboxAccess_userId_expiresAt_idx" ON "SandboxAccess"("userId", "expiresAt");
CREATE INDEX "SandboxAccess_expiresAt_idx" ON "SandboxAccess"("expiresAt");
ALTER TABLE "SandboxAccess" ADD CONSTRAINT "SandboxAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "GcashPayment_accessId_key" ON "GcashPayment"("accessId");
CREATE INDEX "GcashPayment_state_createdAt_idx" ON "GcashPayment"("state", "createdAt");
CREATE UNIQUE INDEX "GcashPayment_reference_key" ON "GcashPayment"("reference");
ALTER TABLE "GcashPayment" ADD CONSTRAINT "GcashPayment_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "SandboxAccess"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GcashPayment" ADD CONSTRAINT "GcashPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Sponsorship_sponsorId_idx" ON "Sponsorship"("sponsorId");
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Referral_invitedId_key" ON "Referral"("invitedId");
CREATE INDEX "Referral_referrerId_qualified_rewarded_idx" ON "Referral"("referrerId", "qualified", "rewarded");
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ScenarioAttempt_userId_passed_idx" ON "ScenarioAttempt"("userId", "passed");
CREATE UNIQUE INDEX "ScenarioAttempt_userId_scenarioKey_key" ON "ScenarioAttempt"("userId", "scenarioKey");
ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The only touch to an existing table: a nullable column and its index.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
