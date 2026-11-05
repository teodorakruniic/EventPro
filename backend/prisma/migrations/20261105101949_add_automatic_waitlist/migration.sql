-- AlterTable
ALTER TABLE "TalkReservation" ALTER COLUMN "ticketToken" DROP DEFAULT;

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "talkId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_talkId_createdAt_id_idx" ON "WaitlistEntry"("talkId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_userId_talkId_key" ON "WaitlistEntry"("userId", "talkId");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "Talk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
