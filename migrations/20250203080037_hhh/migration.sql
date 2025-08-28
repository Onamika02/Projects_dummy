/*
  Warnings:

  - You are about to drop the `admin_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `admin_users`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `operator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('RA', 'RB', 'RG', 'RR', 'SG', 'RT') NOT NULL,
    `alias` ENUM('AIRTEL', 'BANGLALINK', 'GRAMEENPHONE', 'ROBI', 'SKITTO', 'TELETALK') NOT NULL,
    `description` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `accountIdentifier` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `top_up` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referenceNumber` VARCHAR(191) NOT NULL,
    `operator_id` INTEGER NOT NULL,
    `operatorType` ENUM('PREPAID', 'POSTPAID') NOT NULL,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `chargeFee` INTEGER NULL,
    `totalAmount` INTEGER NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `top_up_referenceNumber_key`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_money` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3) NOT NULL,
    `requesterId` INTEGER NOT NULL,
    `requestSenderNumber` VARCHAR(255) NULL,
    `requestedAmount` BIGINT NOT NULL,
    `requestReceiverNumber` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NULL,
    `tradeLicense` TEXT NULL,
    `tinNumber` VARCHAR(191) NULL,
    `organizationType` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NULL,
    `merchantPan` VARCHAR(191) NULL,
    `merchantDomain` VARCHAR(191) NULL,
    `bankAccountNo` VARCHAR(191) NULL,
    `bankAccountName` VARCHAR(191) NULL,
    `bankDomain` VARCHAR(191) NULL,
    `bankBranchName` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `organizationAddress` VARCHAR(191) NULL,
    `organizationName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SplitBill` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` TIMESTAMP(6) NOT NULL,
    `requesterId` INTEGER NOT NULL,
    `requestSenderNumber` VARCHAR(191) NULL,
    `requestedAmount` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requestReceiverNumber` VARCHAR(191) NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `isParent` BOOLEAN NULL,
    `groupId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_setting` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `info` TEXT NULL,
    `userType` ENUM('ADMIN', 'MODERATOR', 'USER', 'MERCHANT', 'CUSTOMER') NOT NULL,
    `createdBy` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `top_up` ADD CONSTRAINT `top_up_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `operator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
