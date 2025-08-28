/*
  Warnings:

  - You are about to drop the `SplitBill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admin_setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merchant_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `operator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `request_money` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `top_up` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `top_up` DROP FOREIGN KEY `top_up_operator_id_fkey`;

-- DropTable
DROP TABLE `SplitBill`;

-- DropTable
DROP TABLE `admin_setting`;

-- DropTable
DROP TABLE `merchant_users`;

-- DropTable
DROP TABLE `operator`;

-- DropTable
DROP TABLE `request_money`;

-- DropTable
DROP TABLE `top_up`;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` TINYINT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `profilePicture` VARCHAR(191) NULL,

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
