-- CreateTable
CREATE TABLE `transaction_leg` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chargeType` ENUM('FIXED', 'PERCENTAGE') NULL,
    `description` VARCHAR(191) NULL,
    `fixedAmount` BIGINT NULL,
    `isEnable` BOOLEAN NOT NULL,
    `maxAmount` BIGINT NULL,
    `minAmount` BIGINT NULL,
    `name` VARCHAR(191) NULL,
    `percentageAmount` BIGINT NULL,
    `type` ENUM('COMMISSION', 'FEE') NULL,
    `generatedTransactionTypeId` BIGINT NOT NULL,
    `originalTransactionTypeId` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_leg_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `changeType` ENUM('UPDATE', 'DELETE', 'CHANGE_STATUS', 'CREATE') NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `createdAt` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `createdByAdmin` BIGINT NULL,
    `transactionLeg_id` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionTypeId` BIGINT NOT NULL,
    `fromAccountId` INTEGER NOT NULL,
    `toAccountId` INTEGER NOT NULL,
    `mainTransactionId` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `isRefunded` BOOLEAN NULL,
    `referenceNo` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `status` ENUM('SUCCESSFUL', 'FAILED', 'PENDING') NOT NULL DEFAULT 'SUCCESSFUL',
    `log` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_type` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `transactionCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dailyLimitAmount` BIGINT NULL,
    `dailyLimitCount` BIGINT NULL,
    `weeklyLimitAmount` BIGINT NULL,
    `weeklyLimitCount` BIGINT NULL,
    `monthlyLimitAmount` BIGINT NULL,
    `monthlyLimitCount` BIGINT NULL,
    `minAmount` INTEGER NULL,
    `maxAmount` INTEGER NULL,
    `createdByAdminId` INTEGER NOT NULL,
    `createdByAdminIdentifier` VARCHAR(191) NOT NULL,
    `updatedByAdminId` INTEGER NULL,
    `updatedByAdminIdentifier` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromChartOfAccount` INTEGER NULL,
    `toChartOfAccount` INTEGER NULL,

    UNIQUE INDEX `transaction_type_transactionCode_key`(`transactionCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_type_change_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `changeType` ENUM('UPDATE', 'DELETE', 'CHANGE_STATUS', 'CREATE') NULL,
    `createdAt` DATETIME(6) NULL,
    `createdByAdminId` INTEGER NULL,
    `createdByAdminIdentifier` VARCHAR(191) NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `transactionType_id` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chart_of_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dailyLimitAmount` DOUBLE NULL,
    `dailyLimitCount` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `headType` ENUM('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE') NOT NULL,
    `maxWalletAmount` DOUBLE NULL,
    `minWalletAmount` DOUBLE NULL,
    `monthlyLimitAmount` DOUBLE NULL,
    `monthlyLimitCount` INTEGER NULL,
    `weeklyLimitAmount` DOUBLE NULL,
    `weeklyLimitCount` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `onlyParent` BOOLEAN NULL,
    `transactionType` ENUM('SYSTEM', 'MEMBER') NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chart_of_accounts_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dailyLimitAmount` INTEGER NULL,
    `dailyLimitCount` INTEGER NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `maxWalletAmount` INTEGER NULL,
    `minWalletAmount` INTEGER NULL,
    `monthlyLimitAmount` INTEGER NULL,
    `monthlyLimitCount` INTEGER NULL,
    `weeklyLimitAmount` INTEGER NULL,
    `weeklyLimitCount` INTEGER NULL,
    `status` ENUM('OPEN', 'LIMITED_ACTIVE', 'FULL_ACTIVE', 'ON_HOLD', 'BLACKLISTED', 'CLOSED') NOT NULL DEFAULT 'FULL_ACTIVE',
    `updatedAt` DATETIME(3) NOT NULL,
    `chartOfAccount_id` INTEGER NOT NULL,
    `aitPercentage` DOUBLE NULL DEFAULT 2.5,

    UNIQUE INDEX `accounts_identifier_key`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountId` BIGINT NULL,
    `accountName` VARCHAR(191) NULL,
    `identifier` VARCHAR(191) NULL,
    `createdBy` BIGINT NULL,
    `dailyLimitCount` BIGINT NULL,
    `dailyLimitAmount` BIGINT NULL,
    `monthlyLimitCount` BIGINT NULL,
    `monthlyLimitAmount` BIGINT NULL,
    `weeklyLimitCount` BIGINT NULL,
    `weeklyLimitAmount` BIGINT NULL,
    `minWalletAmount` BIGINT NULL,
    `maxWalletAmount` BIGINT NULL,
    `status` ENUM('OPEN', 'LIMITED_ACTIVE', 'FULL_ACTIVE', 'ON_HOLD', 'BLACKLISTED', 'CLOSED') NULL,
    `type` VARCHAR(191) NULL,
    `chartOfAccount` INTEGER NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chart_of_account_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `changeType` ENUM('UPDATE', 'DELETE', 'CHANGE_STATUS', 'CREATE') NOT NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdByAdminId` INTEGER NOT NULL,
    `createdByAdminIdentifier` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `transactionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `amount` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('DEBIT', 'CREDIT') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FromAccount` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_FromAccount_AB_unique`(`A`, `B`),
    INDEX `_FromAccount_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ToAccount` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ToAccount_AB_unique`(`A`, `B`),
    INDEX `_ToAccount_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TransactionTypeTotransactionLegLog` (
    `A` BIGINT NOT NULL,
    `B` BIGINT NOT NULL,

    UNIQUE INDEX `_TransactionTypeTotransactionLegLog_AB_unique`(`A`, `B`),
    INDEX `_TransactionTypeTotransactionLegLog_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaction_leg` ADD CONSTRAINT `transaction_leg_generatedTransactionTypeId_fkey` FOREIGN KEY (`generatedTransactionTypeId`) REFERENCES `transaction_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_leg` ADD CONSTRAINT `transaction_leg_originalTransactionTypeId_fkey` FOREIGN KEY (`originalTransactionTypeId`) REFERENCES `transaction_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_leg_log` ADD CONSTRAINT `transaction_leg_log_transactionLeg_id_fkey` FOREIGN KEY (`transactionLeg_id`) REFERENCES `transaction_leg`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_transactionTypeId_fkey` FOREIGN KEY (`transactionTypeId`) REFERENCES `transaction_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_type` ADD CONSTRAINT `transaction_type_fromChartOfAccount_fkey` FOREIGN KEY (`fromChartOfAccount`) REFERENCES `chart_of_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_type` ADD CONSTRAINT `transaction_type_toChartOfAccount_fkey` FOREIGN KEY (`toChartOfAccount`) REFERENCES `chart_of_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_type_change_log` ADD CONSTRAINT `transaction_type_change_log_transactionType_id_fkey` FOREIGN KEY (`transactionType_id`) REFERENCES `transaction_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_chartOfAccount_id_fkey` FOREIGN KEY (`chartOfAccount_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FromAccount` ADD CONSTRAINT `_FromAccount_A_fkey` FOREIGN KEY (`A`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FromAccount` ADD CONSTRAINT `_FromAccount_B_fkey` FOREIGN KEY (`B`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ToAccount` ADD CONSTRAINT `_ToAccount_A_fkey` FOREIGN KEY (`A`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ToAccount` ADD CONSTRAINT `_ToAccount_B_fkey` FOREIGN KEY (`B`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TransactionTypeTotransactionLegLog` ADD CONSTRAINT `_TransactionTypeTotransactionLegLog_A_fkey` FOREIGN KEY (`A`) REFERENCES `transaction_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TransactionTypeTotransactionLegLog` ADD CONSTRAINT `_TransactionTypeTotransactionLegLog_B_fkey` FOREIGN KEY (`B`) REFERENCES `transaction_leg_log`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
