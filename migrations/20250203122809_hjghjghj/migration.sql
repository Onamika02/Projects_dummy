/*
  Warnings:

  - The primary key for the `admin_setting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `admin_setting` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- AlterTable
ALTER TABLE `admin_setting` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `userType` ENUM('ADMIN', 'MODERATOR', 'USER', 'MERCHANT', 'CUSTOMER') NULL,
    MODIFY `createdBy` INTEGER NULL,
    ADD PRIMARY KEY (`id`);
