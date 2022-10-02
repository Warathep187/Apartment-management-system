-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_monthlyRentId_fkey`;

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('REPORT_NEW', 'REPORT_ACCEPTED', 'REPORT_COMPLETED', 'MONTHLY_RENT', 'PAYMENT_ACCEPTED', 'PAYMENT_REJECTED') NOT NULL,
    MODIFY `monthlyRentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_monthlyRentId_fkey` FOREIGN KEY (`monthlyRentId`) REFERENCES `MonthlyRent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
