ALTER TABLE "User" ADD COLUMN "examType" TEXT DEFAULT '省考';

UPDATE "User"
SET "examType" = '省考'
WHERE "examType" IS NULL;
