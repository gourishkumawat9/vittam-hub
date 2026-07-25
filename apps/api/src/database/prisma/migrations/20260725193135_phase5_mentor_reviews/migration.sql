-- CreateTable
CREATE TABLE "mentor_reviews" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "founderId" UUID NOT NULL,
    "bookingRequestId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_reviews_bookingRequestId_key" ON "mentor_reviews"("bookingRequestId");

-- CreateIndex
CREATE INDEX "mentor_reviews_mentorId_idx" ON "mentor_reviews"("mentorId");

-- AddForeignKey
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "mentor_booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

