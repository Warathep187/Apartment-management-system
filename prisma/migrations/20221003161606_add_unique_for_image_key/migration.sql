/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `AnoucementImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `ProfileImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `ReportImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `SlipImage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `AnoucementImage_key_key` ON `AnoucementImage`(`key`);

-- CreateIndex
CREATE UNIQUE INDEX `ProfileImage_key_key` ON `ProfileImage`(`key`);

-- CreateIndex
CREATE UNIQUE INDEX `ReportImage_key_key` ON `ReportImage`(`key`);

-- CreateIndex
CREATE UNIQUE INDEX `SlipImage_key_key` ON `SlipImage`(`key`);
