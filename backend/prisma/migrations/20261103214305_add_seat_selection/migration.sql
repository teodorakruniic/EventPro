/*
  Warnings:

  - A unique constraint covering the columns `[talkId,seatNumber]` on the table `TalkReservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TalkReservation" ADD COLUMN     "seatNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TalkReservation_talkId_seatNumber_key" ON "TalkReservation"("talkId", "seatNumber");
