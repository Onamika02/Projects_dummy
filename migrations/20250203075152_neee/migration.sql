/*
  Warnings:

  - You are about to drop the `_FromAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ToAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TransactionTypeTotransactionLegLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chart_of_account_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chart_of_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ledger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_leg` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_leg_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_type_change_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_FromAccount` DROP FOREIGN KEY `_FromAccount_A_fkey`;

-- DropForeignKey
ALTER TABLE `_FromAccount` DROP FOREIGN KEY `_FromAccount_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ToAccount` DROP FOREIGN KEY `_ToAccount_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ToAccount` DROP FOREIGN KEY `_ToAccount_B_fkey`;

-- DropForeignKey
ALTER TABLE `_TransactionTypeTotransactionLegLog` DROP FOREIGN KEY `_TransactionTypeTotransactionLegLog_A_fkey`;

-- DropForeignKey
ALTER TABLE `_TransactionTypeTotransactionLegLog` DROP FOREIGN KEY `_TransactionTypeTotransactionLegLog_B_fkey`;

-- DropForeignKey
ALTER TABLE `account_logs` DROP FOREIGN KEY `account_logs_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `accounts` DROP FOREIGN KEY `accounts_chartOfAccount_id_fkey`;

-- DropForeignKey
ALTER TABLE `transaction_leg` DROP FOREIGN KEY `transaction_leg_generatedTransactionTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `transaction_leg` DROP FOREIGN KEY `transaction_leg_originalTransactionTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `transaction_leg_log` DROP FOREIGN KEY `transaction_leg_log_transactionLeg_id_fkey`;

-- DropForeignKey
ALTER TABLE `transaction_type` DROP FOREIGN KEY `transaction_type_fromChartOfAccount_fkey`;

-- DropForeignKey
ALTER TABLE `transaction_type` DROP FOREIGN KEY `transaction_type_toChartOfAccount_fkey`;

-- DropForeignKey
ALTER TABLE `transaction_type_change_log` DROP FOREIGN KEY `transaction_type_change_log_transactionType_id_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_transactionTypeId_fkey`;

-- DropTable
DROP TABLE `_FromAccount`;

-- DropTable
DROP TABLE `_ToAccount`;

-- DropTable
DROP TABLE `_TransactionTypeTotransactionLegLog`;

-- DropTable
DROP TABLE `account_logs`;

-- DropTable
DROP TABLE `accounts`;

-- DropTable
DROP TABLE `chart_of_account_logs`;

-- DropTable
DROP TABLE `chart_of_accounts`;

-- DropTable
DROP TABLE `ledger`;

-- DropTable
DROP TABLE `transaction_leg`;

-- DropTable
DROP TABLE `transaction_leg_log`;

-- DropTable
DROP TABLE `transaction_type`;

-- DropTable
DROP TABLE `transaction_type_change_log`;

-- DropTable
DROP TABLE `transactions`;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'MODERATOR') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullname` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `profilePicture` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `fathername` VARCHAR(191) NULL,
    `mothername` VARCHAR(191) NULL,
    `nidnumber` VARCHAR(191) NULL,
    `dob` VARCHAR(191) NULL,
    `nidaddress` VARCHAR(191) NULL,
    `presentAddress` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `hasLiveliness` BOOLEAN NULL,
    `hasNidInfo` BOOLEAN NULL,
    `isEmailVerified` BOOLEAN NULL,
    `isPhoneVerified` BOOLEAN NULL,
    `nidBack` VARCHAR(191) NULL,
    `nidFront` VARCHAR(191) NULL,
    `role` ENUM('MERCHANT', 'USER') NOT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
