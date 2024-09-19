/*
  Warnings:

  - You are about to drop the column `endTime` on the `Cohort` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Cohort` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cohort" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "endDate" TIMESTAMP(3);

