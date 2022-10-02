/*
  Warnings:

  - You are about to drop the column `stayedA` on the `StayedAt` table. All the data in the column will be lost.
  - Added the required column `stayedAt` to the `StayedAt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `StayedAt` DROP COLUMN `stayedA`,
    ADD COLUMN `stayedAt` DATETIME(3) NOT NULL;
