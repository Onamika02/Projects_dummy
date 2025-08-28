/*
  Warnings:

  - Made the column `aitPercentage` on table `accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `accounts` MODIFY `aitPercentage` DECIMAL(10, 2) NOT NULL DEFAULT 2.5;
