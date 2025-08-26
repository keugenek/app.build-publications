import { z } from 'zod';

// -----------------------------------------------------------------------------
// Product (Barang) schemas
// -----------------------------------------------------------------------------
export const productSchema = z.object({
  id: z.string().uuid(),
  nama: z.string(),
  deskripsi: z.string().nullable(), // optional nullable field
  jumlah_stok: z.number().int(),
  harga_satuan: z.number(), // float, stored as numeric in DB
  kode_sku: z.string(),
  created_at: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating a product
export const createProductInputSchema = z.object({
  nama: z.string(),
  deskripsi: z.string().nullable().optional(),
  jumlah_stok: z.number().int().nonnegative().optional(), // default 0
  harga_satuan: z.number().positive(),
  kode_sku: z.string(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating a product
export const updateProductInputSchema = z.object({
  id: z.string().uuid(),
  nama: z.string().optional(),
  deskripsi: z.string().nullable().optional(),
  jumlah_stok: z.number().int().nonnegative().optional(),
  harga_satuan: z.number().positive().optional(),
  kode_sku: z.string().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// -----------------------------------------------------------------------------
// Transaction (Transaksi) schemas
// -----------------------------------------------------------------------------
export const transactionSchema = z.object({
  id: z.string().uuid(),
  tanggal: z.coerce.date(),
  jenis: z.enum(['masuk', 'keluar']),
  produk_id: z.string().uuid(),
  jumlah: z.number().int().positive(),
  pihak_terlibat: z.string().nullable().optional(),
  nomor_referensi: z.string().nullable().optional(),
  created_at: z.coerce.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating a transaction
export const createTransactionInputSchema = z.object({
  tanggal: z.coerce.date(),
  jenis: z.enum(['masuk', 'keluar']),
  produk_id: z.string().uuid(),
  jumlah: z.number().int().positive(),
  pihak_terlibat: z.string().nullable().optional(),
  nomor_referensi: z.string().nullable().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating a transaction
export const updateTransactionInputSchema = z.object({
  id: z.string().uuid(),
  tanggal: z.coerce.date().optional(),
  jenis: z.enum(['masuk', 'keluar']).optional(),
  produk_id: z.string().uuid().optional(),
  jumlah: z.number().int().positive().optional(),
  pihak_terlibat: z.string().nullable().optional(),
  nomor_referensi: z.string().nullable().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;
