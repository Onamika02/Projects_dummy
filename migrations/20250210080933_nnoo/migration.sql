/*
  Warnings:

  - You are about to drop the column `bankDomain` on the `merchant_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `merchant_users` DROP COLUMN `bankDomain`,
    ADD COLUMN `amount` BIGINT NULL,
    ADD COLUMN `billNumber` VARCHAR(191) NULL,
    ADD COLUMN `mcc` VARCHAR(191) NULL,
    ADD COLUMN `merchantCity` VARCHAR(191) NULL,
    ADD COLUMN `merchantName` VARCHAR(191) NULL,
    ADD COLUMN `mid` VARCHAR(191) NULL,
    ADD COLUMN `panMastercard` VARCHAR(191) NULL,
    ADD COLUMN `panUnionPay` VARCHAR(191) NULL,
    ADD COLUMN `panVisa` VARCHAR(191) NULL,
    ADD COLUMN `tid` VARCHAR(191) NULL;
