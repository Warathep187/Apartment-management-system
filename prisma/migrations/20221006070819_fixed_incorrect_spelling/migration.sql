/*
  Warnings:

  - The values [ANOUCEMENT_NEW] on the enum `Notification_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Anoucement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnoucementImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `AnoucementImage` DROP FOREIGN KEY `AnoucementImage_anoucementId_fkey`;

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('REPORT_NEW', 'REPORT_ACCEPTED', 'REPORT_COMPLETED', 'MONTHLY_RENT', 'PAYMENT_ACCEPTED', 'PAYMENT_REJECTED', 'ANNOUNCEMENT_NEW') NOT NULL;

-- DropTable
DROP TABLE `Anoucement`;

-- DropTable
DROP TABLE `AnoucementImage`;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnnouncementImage` (
    `id` VARCHAR(191) NOT NULL,
    `announcementId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `AnnouncementImage_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AnnouncementImage` ADD CONSTRAINT `AnnouncementImage_announcementId_fkey` FOREIGN KEY (`announcementId`) REFERENCES `Announcement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
