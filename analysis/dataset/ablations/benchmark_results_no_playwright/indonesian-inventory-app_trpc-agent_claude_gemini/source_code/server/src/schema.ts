import { z } from 'zod';

// Enum for transaction types
export const jenisTransaksiEnum = z.enum(['Masuk', 'Keluar']);
export type JenisTransaksi = z.infer<typeof jenisTransaksiEnum>;

// Barang (Item) schema
export const barangSchema = z.object({
  id: z.number(),
  nama_barang: z.string(),
  kode_barang: z.string(),
  deskripsi: z.string().nullable(),
  jumlah_stok: z.number().int().nonnegative(),
  harga_beli: z.number().nullable(),
  harga_jual: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Barang = z.infer<typeof barangSchema>;

// Input schema for creating barang
export const createBarangInputSchema = z.object({
  nama_barang: z.string().min(1, "Nama barang wajib diisi"),
  kode_barang: z.string().min(1, "Kode barang wajib diisi"),
  deskripsi: z.string().nullable().optional(),
  harga_beli: z.number().positive().nullable().optional(),
  harga_jual: z.number().positive().nullable().optional()
});

export type CreateBarangInput = z.infer<typeof createBarangInputSchema>;

// Input schema for updating barang
export const updateBarangInputSchema = z.object({
  id: z.number(),
  nama_barang: z.string().min(1).optional(),
  kode_barang: z.string().min(1).optional(),
  deskripsi: z.string().nullable().optional(),
  harga_beli: z.number().positive().nullable().optional(),
  harga_jual: z.number().positive().nullable().optional()
});

export type UpdateBarangInput = z.infer<typeof updateBarangInputSchema>;

// Transaksi (Transaction) schema
export const transaksiSchema = z.object({
  id: z.number(),
  tanggal_transaksi: z.coerce.date(),
  jenis_transaksi: jenisTransaksiEnum,
  barang_id: z.number(),
  jumlah: z.number().int().positive(),
  catatan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaksi = z.infer<typeof transaksiSchema>;

// Input schema for creating transaksi
export const createTransaksiInputSchema = z.object({
  tanggal_transaksi: z.coerce.date(),
  jenis_transaksi: jenisTransaksiEnum,
  barang_id: z.number(),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  catatan: z.string().nullable().optional()
});

export type CreateTransaksiInput = z.infer<typeof createTransaksiInputSchema>;

// Schema for getting transaksi with barang details
export const transaksiWithBarangSchema = z.object({
  id: z.number(),
  tanggal_transaksi: z.coerce.date(),
  jenis_transaksi: jenisTransaksiEnum,
  barang_id: z.number(),
  jumlah: z.number().int().positive(),
  catatan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  barang: barangSchema
});

export type TransaksiWithBarang = z.infer<typeof transaksiWithBarangSchema>;
