-- AlterTable
ALTER TABLE `request_money` ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'DENIED', 'FAILED') NULL;
