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
CREATE TABLE `utility_biller_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `billerCode` VARCHAR(255) NULL,
    `refId` VARCHAR(255) NULL,
    `referenceNumber` VARCHAR(255) NULL,
    `transactionId` VARCHAR(255) NULL,
    `amount` INTEGER NOT NULL,
    `chargeFee` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `note` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utility_save` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `refId` VARCHAR(255) NULL,
    `amount` BIGINT NULL,
    `chargeFee` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `transactionTypeCode` VARCHAR(255) NULL,
    `transactionTypeId` BIGINT NULL,
    `toAccount` VARCHAR(255) NULL,
    `fromAccount` VARCHAR(255) NULL,
    `save` BOOLEAN NOT NULL DEFAULT false,
    `billerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `agentMobile` VARCHAR(191) NULL,
    `transactionTypeCode` VARCHAR(191) NULL,
    `transactionTypeId` BIGINT NULL,
    `note` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `userId` INTEGER NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `toAccount` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(191) NULL,
    `save` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_referenceNumber_key`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_save` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `agentMobile` VARCHAR(191) NULL,
    `transactionTypeCode` VARCHAR(191) NULL,
    `transactionTypeId` BIGINT NULL,
    `note` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `referenceNo` VARCHAR(191) NULL,
    `toAccount` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(191) NULL,
    `save` BOOLEAN NOT NULL DEFAULT false,
    `payment_id` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_save_payment_id_key`(`payment_id`),
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
CREATE TABLE `top_up_save` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `transactionTypeCode` VARCHAR(191) NULL,
    `transactionTypeId` INTEGER NULL,
    `phone` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `note` VARCHAR(191) NULL,
    `operatorId` INTEGER NULL,
    `toAccount` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(191) NULL,
    `operatorType` VARCHAR(191) NULL,
    `save` BOOLEAN NOT NULL DEFAULT false,
    `topUpId` INTEGER NULL,

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
    `status` ENUM('PENDING', 'APPROVED', 'DENIED', 'FAILED') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NULL,
    `amount` BIGINT NULL,
    `tradeLicense` TEXT NULL,
    `tinNumber` VARCHAR(191) NULL,
    `organizationType` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NULL,
    `merchantPan` VARCHAR(191) NULL,
    `merchantDomain` VARCHAR(191) NULL,
    `bankAccountNo` VARCHAR(191) NULL,
    `bankAccountName` VARCHAR(191) NULL,
    `bankBranchName` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `billNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `mcc` VARCHAR(191) NULL,
    `merchantCity` VARCHAR(191) NULL,
    `merchantName` VARCHAR(191) NULL,
    `mid` VARCHAR(191) NULL,
    `organizationAddress` VARCHAR(191) NULL,
    `organizationName` VARCHAR(191) NULL,
    `panMastercard` VARCHAR(191) NULL,
    `panUnionPay` VARCHAR(191) NULL,
    `panVisa` VARCHAR(191) NULL,
    `tid` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `split_bill` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` TIMESTAMP(6) NOT NULL,
    `requesterId` INTEGER NOT NULL,
    `requestSenderNumber` VARCHAR(191) NULL,
    `requestedAmount` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `requestReceiverNumber` VARCHAR(191) NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `isParent` BOOLEAN NULL,
    `groupId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `info` TEXT NULL,
    `userType` ENUM('MERCHANT', 'CUSTOMER') NOT NULL,
    `createdBy` INTEGER NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fund_transfer_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` ENUM('BANK', 'CARD', 'MFS') NOT NULL,
    `name` VARCHAR(191) NULL,
    `identifier` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `cardNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `districtName` VARCHAR(191) NULL,
    `cardType` VARCHAR(191) NULL,
    `transactionCode` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `distributorId` BIGINT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `mfsType` VARCHAR(191) NULL,
    `transactionStatus` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `referenceNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fund_transfer_logs_referenceNumber_key`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fund_transfer_save` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` ENUM('BANK', 'CARD', 'MFS') NOT NULL,
    `accountNumber` VARCHAR(191) NULL,
    `cardNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `districtName` VARCHAR(191) NULL,
    `cardType` VARCHAR(191) NULL,
    `transactionTypeId` BIGINT NULL,
    `amount` BIGINT NULL,
    `distributorId` BIGINT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `mfsType` VARCHAR(191) NULL,
    `toAccount` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(191) NULL,
    `isSave` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `add_money_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` ENUM('BANK', 'CARD', 'MFS') NOT NULL,
    `name` VARCHAR(191) NULL,
    `identifier` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `cardNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `districtName` VARCHAR(191) NULL,
    `cardType` VARCHAR(191) NULL,
    `transactionCode` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `distributorId` BIGINT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `mfsType` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DENIED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `referenceNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `add_money_logs_referenceNumber_key`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `add_money_save` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` ENUM('BANK', 'CARD', 'MFS') NOT NULL,
    `accountNumber` VARCHAR(191) NULL,
    `cardNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `districtName` VARCHAR(191) NULL,
    `cardType` VARCHAR(191) NULL,
    `transactionTypeId` BIGINT NULL,
    `amount` BIGINT NULL,
    `distributorId` BIGINT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `mfsType` VARCHAR(191) NULL,
    `toAccount` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(191) NULL,
    `isSave` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `send_money_save` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `receiverPhone` VARCHAR(191) NULL,
    `amount` BIGINT NULL,
    `cardId` INTEGER NULL,
    `requestId` INTEGER NULL,
    `transactionTypeCode` VARCHAR(191) NULL,
    `transactionTypeId` BIGINT NULL,
    `note` VARCHAR(191) NULL,
    `requestType` VARCHAR(191) NULL,
    `toAccount` VARCHAR(191) NULL,
    `fromAccount` VARCHAR(191) NULL,
    `save` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_save` ADD CONSTRAINT `payment_save_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `top_up` ADD CONSTRAINT `top_up_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `operator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `top_up_save` ADD CONSTRAINT `top_up_save_topUpId_fkey` FOREIGN KEY (`topUpId`) REFERENCES `top_up`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
