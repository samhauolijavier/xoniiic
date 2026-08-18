CREATE TYPE "ResourceKind" AS ENUM ('video', 'document', 'scenario');

CREATE TABLE "Resource" (
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

CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");
CREATE INDEX "Resource_track_published_position_idx" ON "Resource"("track", "published", "position");
CREATE INDEX "Resource_published_createdAt_idx" ON "Resource"("published", "createdAt");

INSERT INTO "SiteSetting" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid()::text, 'private.gcashNumber', '09279888301', NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW();
