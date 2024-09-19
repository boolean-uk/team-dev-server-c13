-- AlterTable
ALTER TABLE "Cohort" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "mobile" TEXT DEFAULT E'',
ADD COLUMN     "specialism" TEXT DEFAULT E'';
