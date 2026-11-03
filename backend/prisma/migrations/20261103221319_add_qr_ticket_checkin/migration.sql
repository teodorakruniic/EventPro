
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add the ticket token as nullable first
ALTER TABLE "TalkReservation"
ADD COLUMN "ticketToken" UUID;

-- Populate tickets for existing reservations
UPDATE "TalkReservation"
SET "ticketToken" = gen_random_uuid()
WHERE "ticketToken" IS NULL;

-- Make the token required and generate it for future reservations
ALTER TABLE "TalkReservation"
ALTER COLUMN "ticketToken" SET NOT NULL,
ALTER COLUMN "ticketToken" SET DEFAULT gen_random_uuid();

-- Add check-in fields
ALTER TABLE "TalkReservation"
ADD COLUMN "checkedInAt" TIMESTAMP(3),
ADD COLUMN "checkedInBy" UUID;

-- Ensure every ticket has a unique token
CREATE UNIQUE INDEX "TalkReservation_ticketToken_key"
ON "TalkReservation"("ticketToken");
