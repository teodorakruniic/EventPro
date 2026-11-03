/*
  Warnings:

  - You are about to drop the column `capacity` on the `ConferenceRegistration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conference" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "ConferenceRegistration" DROP COLUMN "capacity";
