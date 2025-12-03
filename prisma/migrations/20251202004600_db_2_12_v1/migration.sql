/*
  Warnings:

  - You are about to drop the column `ma_su_kien` on the `dat_ve` table. All the data in the column will be lost.
  - Added the required column `id_phien_su_kien` to the `DAT_VE` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `dat_ve` DROP FOREIGN KEY `DAT_VE_ma_su_kien_fkey`;

-- DropIndex
DROP INDEX `DAT_VE_ma_su_kien_fkey` ON `dat_ve`;

-- AlterTable
ALTER TABLE `dat_ve` DROP COLUMN `ma_su_kien`,
    ADD COLUMN `id_phien_su_kien` VARCHAR(191) NOT NULL,
    ADD COLUMN `sU_KIENId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `DAT_VE` ADD CONSTRAINT `DAT_VE_id_phien_su_kien_fkey` FOREIGN KEY (`id_phien_su_kien`) REFERENCES `PHIEN_SU_KIEN`(`id_phien_su_kien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DAT_VE` ADD CONSTRAINT `DAT_VE_sU_KIENId_fkey` FOREIGN KEY (`sU_KIENId`) REFERENCES `SU_KIEN`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
