/*
  Warnings:

  - You are about to drop the column `ma_giao_dich` on the `thanh_toan` table. All the data in the column will be lost.
  - Added the required column `duong_dan` to the `THANH_TOAN` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `thanh_toan` DROP COLUMN `ma_giao_dich`,
    ADD COLUMN `duong_dan` VARCHAR(191) NOT NULL,
    MODIFY `trang_thai` ENUM('DANG_XU_LY', 'THANH_CONG', 'THAT_BAI') NOT NULL DEFAULT 'DANG_XU_LY';
