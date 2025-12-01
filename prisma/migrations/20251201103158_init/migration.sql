-- CreateTable
CREATE TABLE `VAI_TRO` (
    `id_vai_tro` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_vai_tro` VARCHAR(191) NOT NULL,
    `mo_ta` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_vai_tro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NGUOI_DUNG` (
    `id_nguoi_dung` VARCHAR(191) NOT NULL,
    `id_vai_tro` INTEGER NOT NULL,
    `ho_ten` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `mat_khau` VARCHAR(191) NOT NULL,
    `so_dien_thoai` CHAR(10) NULL,
    `ngay_sinh` DATE NULL,
    `gioi_tinh` ENUM('NAM', 'NU', 'KHAC') NOT NULL DEFAULT 'NAM',
    `da_xac_thuc` BOOLEAN NOT NULL DEFAULT false,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    UNIQUE INDEX `NGUOI_DUNG_email_key`(`email`),
    PRIMARY KEY (`id_nguoi_dung`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TOKEN_XAC_THUC` (
    `id_token` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `thoi_gian_het_han` DATETIME(3) NOT NULL,
    `id_nguoi_dung` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TOKEN_XAC_THUC_token_key`(`token`),
    PRIMARY KEY (`id_token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KHACH` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach` CHAR(7) NULL,
    `id_nguoi_dung` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `KHACH_ma_khach_key`(`ma_khach`),
    UNIQUE INDEX `KHACH_id_nguoi_dung_key`(`id_nguoi_dung`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NHAN_VIEN` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_nhan_vien` CHAR(5) NULL,
    `id_nguoi_dung` VARCHAR(191) NOT NULL,
    `id_admin` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `NHAN_VIEN_ma_nhan_vien_key`(`ma_nhan_vien`),
    UNIQUE INDEX `NHAN_VIEN_id_nguoi_dung_key`(`id_nguoi_dung`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LOAI_SU_KIEN` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_loai_su_kien` VARCHAR(191) NOT NULL,
    `duong_dan` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SU_KIEN` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_loai_su_kien` INTEGER NOT NULL,
    `ma_su_kien` CHAR(7) NULL,
    `ma_nhan_vien` CHAR(5) NOT NULL,
    `ten_su_kien` VARCHAR(191) NOT NULL,
    `mo_ta` TEXT NOT NULL,
    `ngay_bat_dau` DATETIME(3) NOT NULL,
    `ngay_ket_thuc` DATETIME(3) NOT NULL,
    `dia_diem` VARCHAR(191) NOT NULL,
    `kinh_do` DOUBLE NOT NULL,
    `vi_do` DOUBLE NOT NULL,
    `trang_thai` ENUM('NHAP', 'DANG_DUYET', 'DA_DUYET', 'KET_THUC') NOT NULL DEFAULT 'NHAP',
    `hinh_anh` VARCHAR(191) NOT NULL,
    `duong_dan` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    UNIQUE INDEX `SU_KIEN_ma_su_kien_key`(`ma_su_kien`),
    UNIQUE INDEX `SU_KIEN_duong_dan_key`(`duong_dan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SU_KIEN_PHE_DUYET` (
    `id_su_kien_phe_duyet` VARCHAR(191) NOT NULL,
    `ma_su_kien` CHAR(7) NOT NULL,
    `id_admin` VARCHAR(191) NULL,
    `trang_thai` ENUM('DUOC_PHE_DUYET', 'DANG_XU_LY', 'TU_CHOI') NOT NULL DEFAULT 'DANG_XU_LY',
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_duyet` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_su_kien_phe_duyet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PHIEN_SU_KIEN` (
    `id_phien_su_kien` VARCHAR(191) NOT NULL,
    `ma_su_kien` VARCHAR(191) NOT NULL,
    `thoi_gian_bat_dau` DATETIME(3) NOT NULL,
    `thoi_gian_ket_thuc` DATETIME(3) NOT NULL,
    `thoi_gian_mo_dat_ve` DATETIME(3) NOT NULL,
    `thoi_gian_dong_dat_ve` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_phien_su_kien`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LOAI_VE` (
    `id_loai_ve` VARCHAR(191) NOT NULL,
    `id_phien_su_kien` VARCHAR(191) NOT NULL,
    `ten_ve` VARCHAR(191) NOT NULL,
    `gia_ve` DECIMAL(10, 0) NOT NULL,
    `so_luong_con` INTEGER NOT NULL,
    `so_luong_mua_min` TINYINT NOT NULL,
    `so_luong_mua_max` TINYINT NOT NULL,
    `mo_ta` TEXT NOT NULL,

    PRIMARY KEY (`id_loai_ve`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DAT_VE` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_don_hang` CHAR(10) NULL,
    `ma_khach` CHAR(7) NOT NULL,
    `ma_su_kien` CHAR(7) NOT NULL,
    `tong_tien` DECIMAL(65, 30) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `het_han` DATETIME(3) NOT NULL,
    `trang_thai` ENUM('CHO_THANH_TOAN', 'HOAN_TAT', 'HUY') NOT NULL DEFAULT 'CHO_THANH_TOAN',

    UNIQUE INDEX `DAT_VE_ma_don_hang_key`(`ma_don_hang`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CHI_TIET_DAT_VE` (
    `id_chi_tiet` VARCHAR(191) NOT NULL,
    `ma_don_hang` CHAR(10) NOT NULL,
    `id_loai_ve` VARCHAR(191) NULL,
    `id_ghe_dat` VARCHAR(191) NULL,
    `ma_ghe` VARCHAR(191) NULL,
    `ten_loai_ve` VARCHAR(191) NOT NULL,
    `so_luong` TINYINT NOT NULL,
    `don_gia` DECIMAL(10, 0) NOT NULL,
    `thanh_tien` DECIMAL(10, 0) NOT NULL,

    PRIMARY KEY (`id_chi_tiet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VE` (
    `id_ve` VARCHAR(191) NOT NULL,
    `id_chi_tiet` VARCHAR(191) NOT NULL,
    `trang_thai` ENUM('CHUA_CHECK_IN', 'DA_CHECK_IN') NOT NULL DEFAULT 'CHUA_CHECK_IN',
    `QR_code` TEXT NOT NULL,
    `ngay_phat_hanh` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_check_in` DATETIME(3) NULL,

    PRIMARY KEY (`id_ve`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GHE` (
    `id` VARCHAR(191) NOT NULL,
    `hang_ghe` VARCHAR(191) NOT NULL,
    `ma_ghe` VARCHAR(191) NOT NULL,
    `loai` VARCHAR(191) NOT NULL,
    `loai_ghe` VARCHAR(191) NOT NULL,
    `gia` DECIMAL(10, 0) NOT NULL,
    `ma_su_kien` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GHE_DAT` (
    `id` VARCHAR(191) NOT NULL,
    `id_ghe` VARCHAR(191) NOT NULL,
    `id_phien_su_kien` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `GHE_DAT_id_ghe_id_phien_su_kien_key`(`id_ghe`, `id_phien_su_kien`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `THANH_TOAN` (
    `id` VARCHAR(191) NOT NULL,
    `ma_don_hang` CHAR(10) NOT NULL,
    `cong_thanh_toan` VARCHAR(191) NOT NULL,
    `ma_giao_dich` VARCHAR(191) NOT NULL,
    `so_tien` DECIMAL(10, 0) NOT NULL,
    `trang_thai` ENUM('THANH_CONG', 'THAT_BAI') NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NGUOI_DUNG` ADD CONSTRAINT `NGUOI_DUNG_id_vai_tro_fkey` FOREIGN KEY (`id_vai_tro`) REFERENCES `VAI_TRO`(`id_vai_tro`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TOKEN_XAC_THUC` ADD CONSTRAINT `TOKEN_XAC_THUC_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `NGUOI_DUNG`(`id_nguoi_dung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KHACH` ADD CONSTRAINT `KHACH_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `NGUOI_DUNG`(`id_nguoi_dung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NHAN_VIEN` ADD CONSTRAINT `NHAN_VIEN_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `NGUOI_DUNG`(`id_nguoi_dung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NHAN_VIEN` ADD CONSTRAINT `NHAN_VIEN_id_admin_fkey` FOREIGN KEY (`id_admin`) REFERENCES `NGUOI_DUNG`(`id_nguoi_dung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SU_KIEN` ADD CONSTRAINT `SU_KIEN_id_loai_su_kien_fkey` FOREIGN KEY (`id_loai_su_kien`) REFERENCES `LOAI_SU_KIEN`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SU_KIEN` ADD CONSTRAINT `SU_KIEN_ma_nhan_vien_fkey` FOREIGN KEY (`ma_nhan_vien`) REFERENCES `NHAN_VIEN`(`ma_nhan_vien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SU_KIEN_PHE_DUYET` ADD CONSTRAINT `SU_KIEN_PHE_DUYET_ma_su_kien_fkey` FOREIGN KEY (`ma_su_kien`) REFERENCES `SU_KIEN`(`ma_su_kien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SU_KIEN_PHE_DUYET` ADD CONSTRAINT `SU_KIEN_PHE_DUYET_id_admin_fkey` FOREIGN KEY (`id_admin`) REFERENCES `NGUOI_DUNG`(`id_nguoi_dung`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PHIEN_SU_KIEN` ADD CONSTRAINT `PHIEN_SU_KIEN_ma_su_kien_fkey` FOREIGN KEY (`ma_su_kien`) REFERENCES `SU_KIEN`(`ma_su_kien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LOAI_VE` ADD CONSTRAINT `LOAI_VE_id_phien_su_kien_fkey` FOREIGN KEY (`id_phien_su_kien`) REFERENCES `PHIEN_SU_KIEN`(`id_phien_su_kien`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DAT_VE` ADD CONSTRAINT `DAT_VE_ma_su_kien_fkey` FOREIGN KEY (`ma_su_kien`) REFERENCES `SU_KIEN`(`ma_su_kien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DAT_VE` ADD CONSTRAINT `DAT_VE_ma_khach_fkey` FOREIGN KEY (`ma_khach`) REFERENCES `KHACH`(`ma_khach`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CHI_TIET_DAT_VE` ADD CONSTRAINT `CHI_TIET_DAT_VE_ma_don_hang_fkey` FOREIGN KEY (`ma_don_hang`) REFERENCES `DAT_VE`(`ma_don_hang`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CHI_TIET_DAT_VE` ADD CONSTRAINT `CHI_TIET_DAT_VE_id_loai_ve_fkey` FOREIGN KEY (`id_loai_ve`) REFERENCES `LOAI_VE`(`id_loai_ve`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VE` ADD CONSTRAINT `VE_id_chi_tiet_fkey` FOREIGN KEY (`id_chi_tiet`) REFERENCES `CHI_TIET_DAT_VE`(`id_chi_tiet`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GHE` ADD CONSTRAINT `GHE_ma_su_kien_fkey` FOREIGN KEY (`ma_su_kien`) REFERENCES `SU_KIEN`(`ma_su_kien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GHE_DAT` ADD CONSTRAINT `GHE_DAT_id_ghe_fkey` FOREIGN KEY (`id_ghe`) REFERENCES `GHE`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GHE_DAT` ADD CONSTRAINT `GHE_DAT_id_phien_su_kien_fkey` FOREIGN KEY (`id_phien_su_kien`) REFERENCES `PHIEN_SU_KIEN`(`id_phien_su_kien`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `THANH_TOAN` ADD CONSTRAINT `THANH_TOAN_ma_don_hang_fkey` FOREIGN KEY (`ma_don_hang`) REFERENCES `DAT_VE`(`ma_don_hang`) ON DELETE RESTRICT ON UPDATE CASCADE;
