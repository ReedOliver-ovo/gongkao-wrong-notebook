-- AlterTable
ALTER TABLE "ErrorItem" ADD COLUMN "examType" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "subjectModule" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "questionType" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "optionsJson" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "mistakeReason" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "aiMistakeReasonSuggestion" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "fastestSolution" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "trapAnalysis" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "nextReviewTip" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "similarQuestionMethod" TEXT;
ALTER TABLE "ErrorItem" ADD COLUMN "masteryStatus" TEXT NOT NULL DEFAULT '未复盘';
ALTER TABLE "ErrorItem" ADD COLUMN "nextReviewAt" DATETIME;
ALTER TABLE "ErrorItem" ADD COLUMN "lastReviewedAt" DATETIME;
ALTER TABLE "ErrorItem" ADD COLUMN "consecutiveCorrectCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ErrorItem" ADD COLUMN "wrongReviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReviewSchedule" ADD COLUMN "reviewStage" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "contentJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReviewSchedule_scheduledFor_idx" ON "ReviewSchedule"("scheduledFor");

-- CreateIndex
CREATE INDEX "ReviewSchedule_errorItemId_reviewStage_idx" ON "ReviewSchedule"("errorItemId", "reviewStage");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_userId_weekStart_key" ON "WeeklyReport"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "WeeklyReport_userId_weekEnd_idx" ON "WeeklyReport"("userId", "weekEnd");
