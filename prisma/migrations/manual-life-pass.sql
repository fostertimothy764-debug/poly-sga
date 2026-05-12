-- Life pass migration: officer profile fields, suggestion status, announcement leadImage.
-- Idempotent — safe to re-run.
-- Apply with: psql "$DIRECT_URL" -f prisma/migrations/manual-life-pass.sql
--    OR:      npx prisma db push  (once DIRECT_URL endpoint is reachable)

ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "leadImage" TEXT;

ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "pronouns" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "askMeAbout" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "schoolEmail" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "instagram" TEXT;

ALTER TABLE "Suggestion" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "Suggestion" ADD COLUMN IF NOT EXISTS "statusLabel" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN IF NOT EXISTS "statusNote" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN IF NOT EXISTS "statusUpdatedById" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN IF NOT EXISTS "statusUpdatedByName" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP(3);
