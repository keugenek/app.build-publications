import { z } from 'zod';

// Barang (Item) schema
export const barangSchema = z.object({
  id: z.number(),
  nama: z.string(),
  kode_barang: z.string(),
  deskripsi: z.string().nullable(),
  harga: z.number(),
  stok: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Barang = z.infer<typeof barangSchema>;

// Input schema untuk menambah barang
export const createBarangInputSchema = z.object({
  nama: z.string().min(1, 'Nama barang wajib diisi'),
  kode_barang: z.string().min(1, 'Kode barang wajib diisi'),
  deskripsi: z.string().nullable(),
  harga: z.number().nonnegative('Harga harus bernilai positif atau nol'),
  stok: z.number().int().nonnegative('Stok harus bernilai positif atau nol').default(0)
});

export type CreateBarangInput = z.infer<typeof createBarangInputSchema>;

// Input schema untuk mengedit barang
export const updateBarangInputSchema = z.object({
  id: z.number(),
  nama: z.string().min(1, 'Nama barang wajib diisi').optional(),
  kode_barang: z.string().min(1, 'Kode barang wajib diisi').optional(),
  deskripsi: z.string().nullable().optional(),
  harga: z.number().nonnegative('Harga harus bernilai positif atau nol').optional(),
  stok: z.number().int().nonnegative('Stok harus bernilai positif atau nol').optional()
});

export type UpdateBarangInput = z.infer<typeof updateBarangInputSchema>;

// Enum untuk jenis transaksi
export const jenisTransaksiEnum = z.enum(['MASUK', 'KELUAR']);
export type JenisTransaksi = z.infer<typeof jenisTransaksiEnum>;

// Transaksi schema
export const transaksiSchema = z.object({
  id: z.number(),
  tanggal: z.coerce.date(),
  barang_id: z.number(),
  jenis: jenisTransaksiEnum,
  jumlah: z.number().int().positive(),
  keterangan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaksi = z.infer<typeof transaksiSchema>;

// Transaksi dengan informasi barang
export const transaksiWithBarangSchema = z.object({
  id: z.number(),
  tanggal: z.coerce.date(),
  barang_id: z.number(),
  jenis: jenisTransaksiEnum,
  jumlah: z.number().int().positive(),
  keterangan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  barang: barangSchema
});

export type TransaksiWithBarang = z.infer<typeof transaksiWithBarangSchema>;

// Input schema untuk transaksi barang masuk
export const createTransaksiMasukInputSchema = z.object({
  tanggal: z.coerce.date(),
  barang_id: z.number().positive('ID barang harus valid'),
  jumlah: z.number().int().positive('Jumlah harus lebih dari 0'),
  keterangan: z.string().nullable()
});

export type CreateTransaksiMasukInput = z.infer<typeof createTransaksiMasukInputSchema>;

// Input schema untuk transaksi barang keluar
export const createTransaksiKeluarInputSchema = z.object({
  tanggal: z.coerce.date(),
  barang_id: z.number().positive('ID barang harus valid'),
  jumlah: z.number().int().positive('Jumlah harus lebih dari 0'),
  keterangan: z.string().nullable()
});

export type CreateTransaksiKeluarInput = z.infer<typeof createTransaksiKeluarInputSchema>;

// Input schema untuk menghapus barang
export const deleteBarangInputSchema = z.object({
  id: z.number().positive('ID barang harus valid')
});

export type DeleteBarangInput = z.infer<typeof deleteBarangInputSchema>;

// Input schema untuk mengambil barang berdasarkan ID
export const getBarangByIdInputSchema = z.object({
  id: z.number().positive('ID barang harus valid')
});

export type GetBarangByIdInput = z.infer<typeof getBarangByIdInputSchema>;

// Input schema untuk mengambil transaksi berdasarkan barang
export const getTransaksiByBarangInputSchema = z.object({
  barang_id: z.number().positive('ID barang harus valid')
});

export type GetTransaksiByBarangInput = z.infer<typeof getTransaksiByBarangInputSchema>;
