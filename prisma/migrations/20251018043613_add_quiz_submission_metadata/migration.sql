ALTER TABLE "QuizSubmission"
  RENAME COLUMN "participant" TO "participantName";

ALTER TABLE "QuizSubmission"
  ADD COLUMN "correctCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "incorrectCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "durationSeconds" INTEGER,
  ADD COLUMN "deviceType" TEXT,
  ADD COLUMN "clientIp" TEXT;