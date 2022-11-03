-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('REPORT_NEW', 'REPORT_ACCEPTED', 'REPORT_COMPLETED', 'MONTHLY_RENT', 'PAYMENT_ACCEPTED', 'PAYMENT_REJECTED', 'ANOUCEMENT_NEW') NOT NULL;

-- CreateTable
CREATE TABLE `Anoucement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnoucementImage` (
    `id` VARCHAR(191) NOT NULL,
    `anoucementId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AnoucementImage` ADD CONSTRAINT `AnoucementImage_anoucementId_fkey` FOREIGN KEY (`anoucementId`) REFERENCES `Anoucement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
