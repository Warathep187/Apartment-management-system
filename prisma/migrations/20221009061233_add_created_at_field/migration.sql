/*
  Warnings:

  - Added the required column `createdAt` to the `MonthlyRent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MonthlyRent` ADD COLUMN `createdAt` DATETIME(3) NOT NULL;
