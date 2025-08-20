import { z } from 'zod';

// Barang (Item) schema
export const barangSchema = z.object({
  id: z.number(),
  nama_barang: z.string(),
  kode_sku: z.string(),
  jumlah_stok: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Barang = z.infer<typeof barangSchema>;

// Input schema for creating barang
export const createBarangInputSchema = z.object({
  nama_barang: z.string().min(1, "Nama barang harus diisi"),
  kode_sku: z.string().min(1, "Kode SKU harus diisi"),
  jumlah_stok: z.number().int().nonnegative().default(0)
});

export type CreateBarangInput = z.infer<typeof createBarangInputSchema>;

// Input schema for updating barang
export const updateBarangInputSchema = z.object({
  id: z.number(),
  nama_barang: z.string().min(1, "Nama barang harus diisi").optional(),
  kode_sku: z.string().min(1, "Kode SKU harus diisi").optional(),
  jumlah_stok: z.number().int().nonnegative().optional()
});

export type UpdateBarangInput = z.infer<typeof updateBarangInputSchema>;

// Transaction type enum
export const jenisTransaksiEnum = z.enum(['masuk', 'keluar']);
export type JenisTransaksi = z.infer<typeof jenisTransaksiEnum>;

// Transaksi schema
export const transaksiSchema = z.object({
  id: z.number(),
  kode_sku: z.string(),
  jenis_transaksi: jenisTransaksiEnum,
  jumlah: z.number().int().positive(),
  tanggal_transaksi: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaksi = z.infer<typeof transaksiSchema>;

// Input schema for creating transaksi barang masuk
export const createTransaksiMasukInputSchema = z.object({
  kode_sku: z.string().min(1, "Kode SKU harus diisi"),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  tanggal_transaksi: z.coerce.date().optional().default(() => new Date())
});

export type CreateTransaksiMasukInput = z.infer<typeof createTransaksiMasukInputSchema>;

// Input schema for creating transaksi barang keluar
export const createTransaksiKeluarInputSchema = z.object({
  kode_sku: z.string().min(1, "Kode SKU harus diisi"),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  tanggal_transaksi: z.coerce.date().optional().default(() => new Date())
});

export type CreateTransaksiKeluarInput = z.infer<typeof createTransaksiKeluarInputSchema>;

// Get barang by SKU input schema
export const getBarangBySkuInputSchema = z.object({
  kode_sku: z.string().min(1, "Kode SKU harus diisi")
});

export type GetBarangBySkuInput = z.infer<typeof getBarangBySkuInputSchema>;

// Delete barang input schema
export const deleteBarangInputSchema = z.object({
  id: z.number()
});

export type DeleteBarangInput = z.infer<typeof deleteBarangInputSchema>;

// Get transaksi by SKU input schema
export const getTransaksiBySkuInputSchema = z.object({
  kode_sku: z.string().min(1, "Kode SKU harus diisi")
});

export type GetTransaksiBySkuInput = z.infer<typeof getTransaksiBySkuInputSchema>;
