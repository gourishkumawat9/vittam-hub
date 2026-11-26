-- A mentor session gets a time, a length, a meeting link and a note once the
-- mentor accepts, and a completion time once either side marks it done.
ALTER TABLE "mentor_booking_requests"
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "durationMinutes" INTEGER,
  ADD COLUMN "meetingUrl" TEXT,
  ADD COLUMN "mentorNote" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3);
