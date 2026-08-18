-- Written to be safe to run twice. A migration that half-applies and then
-- refuses to run again leaves someone reading Postgres error codes to work out
-- which statements landed, which is the worst possible moment to be doing that.
DO $$ BEGIN
  CREATE TYPE "ResourceKind" AS ENUM ('video', 'document', 'scenario');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "track" TEXT NOT NULL,
    "kind" "ResourceKind" NOT NULL,
    "videoUrl" TEXT,
    "filePath" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Resource_slug_key" ON "Resource"("slug");
CREATE INDEX IF NOT EXISTS "Resource_track_published_position_idx" ON "Resource"("track", "published", "position");
CREATE INDEX IF NOT EXISTS "Resource_published_createdAt_idx" ON "Resource"("published", "createdAt");

INSERT INTO "SiteSetting" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid()::text, 'private.gcashNumber', '09279888301', NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW();
