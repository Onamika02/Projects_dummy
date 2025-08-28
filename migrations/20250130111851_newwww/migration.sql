/*
  Warnings:

  - You are about to alter the column `accountId` on the `account_logs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- AlterTable
ALTER TABLE `account_logs` MODIFY `accountId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `account_logs` ADD CONSTRAINT `account_logs_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
