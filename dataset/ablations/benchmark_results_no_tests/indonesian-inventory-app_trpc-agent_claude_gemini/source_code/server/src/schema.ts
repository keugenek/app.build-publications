import { z } from 'zod';

// Enum untuk jenis transaksi
export const jenisTransaksiEnum = z.enum(['masuk', 'keluar']);
export type JenisTransaksi = z.infer<typeof jenisTransaksiEnum>;

// Schema untuk barang
export const barangSchema = z.object({
  id: z.number(),
  nama: z.string(),
  kode: z.string(),
  jumlah_stok: z.number().int().nonnegative(),
  deskripsi: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Barang = z.infer<typeof barangSchema>;

// Schema untuk input membuat barang baru
export const createBarangInputSchema = z.object({
  nama: z.string().min(1, "Nama barang harus diisi"),
  kode: z.string().min(1, "Kode barang harus diisi"),
  jumlah_stok: z.number().int().nonnegative("Jumlah stok harus berupa angka positif"),
  deskripsi: z.string().nullable()
});

export type CreateBarangInput = z.infer<typeof createBarangInputSchema>;

// Schema untuk input update barang
export const updateBarangInputSchema = z.object({
  id: z.number(),
  nama: z.string().min(1).optional(),
  kode: z.string().min(1).optional(),
  jumlah_stok: z.number().int().nonnegative().optional(),
  deskripsi: z.string().nullable().optional()
});

export type UpdateBarangInput = z.infer<typeof updateBarangInputSchema>;

// Schema untuk transaksi
export const transaksiSchema = z.object({
  id: z.number(),
  jenis: jenisTransaksiEnum,
  barang_id: z.number(),
  nama_barang: z.string(),
  jumlah: z.number().int().positive(),
  tanggal_transaksi: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaksi = z.infer<typeof transaksiSchema>;

// Schema untuk input membuat transaksi baru
export const createTransaksiInputSchema = z.object({
  jenis: jenisTransaksiEnum,
  barang_id: z.number(),
  jumlah: z.number().int().positive("Jumlah harus berupa angka positif"),
  tanggal_transaksi: z.coerce.date().optional().default(() => new Date())
});

export type CreateTransaksiInput = z.infer<typeof createTransaksiInputSchema>;

// Schema untuk mendapatkan barang berdasarkan ID
export const getBarangByIdInputSchema = z.object({
  id: z.number()
});

export type GetBarangByIdInput = z.infer<typeof getBarangByIdInputSchema>;

// Schema untuk mendapatkan transaksi berdasarkan barang ID
export const getTransaksiByBarangIdInputSchema = z.object({
  barang_id: z.number()
});

export type GetTransaksiByBarangIdInput = z.infer<typeof getTransaksiByBarangIdInputSchema>;

// Schema untuk menghapus barang
export const deleteBarangInputSchema = z.object({
  id: z.number()
});

export type DeleteBarangInput = z.infer<typeof deleteBarangInputSchema>;
