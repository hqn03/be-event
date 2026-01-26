/*
  Warnings:

  - You are about to drop the column `sU_KIENId` on the `dat_ve` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `dat_ve` DROP FOREIGN KEY `DAT_VE_sU_KIENId_fkey`;

-- DropIndex
DROP INDEX `DAT_VE_sU_KIENId_fkey` ON `dat_ve`;

-- AlterTable
ALTER TABLE `dat_ve` DROP COLUMN `sU_KIENId`;
