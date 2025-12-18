/*
  Warnings:

  - The values [DA_CHECK_IN] on the enum `VE_trang_thai` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `ve` MODIFY `trang_thai` ENUM('CHUA_CHECK_IN', 'CHECKED_IN', 'USED', 'EXPIRED') NOT NULL DEFAULT 'CHUA_CHECK_IN';
