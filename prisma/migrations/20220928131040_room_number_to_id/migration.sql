/*
  Warnings:

  - The primary key for the `Room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Room` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_roomId_fkey`;

-- DropIndex
DROP INDEX `Room_number_idx` ON `Room`;

-- DropIndex
DROP INDEX `Room_number_key` ON `Room`;

-- AlterTable
ALTER TABLE `Room` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    MODIFY `number` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`number`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`number`) ON DELETE SET NULL ON UPDATE CASCADE;
