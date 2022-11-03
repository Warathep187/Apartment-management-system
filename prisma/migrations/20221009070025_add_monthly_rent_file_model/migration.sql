-- CreateTable
CREATE TABLE `MonthlyRentFile` (
    `monthlyRentId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MonthlyRentFile_monthlyRentId_key`(`monthlyRentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthlyRentFile` ADD CONSTRAINT `MonthlyRentFile_monthlyRentId_fkey` FOREIGN KEY (`monthlyRentId`) REFERENCES `MonthlyRent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
