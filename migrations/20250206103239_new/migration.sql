/*
  Warnings:

  - Made the column `userType` on table `admin_setting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `admin_setting` MODIFY `userType` ENUM('MERCHANT', 'CUSTOMER') NOT NULL,
    MODIFY `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    MODIFY `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
