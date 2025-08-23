import { z } from 'zod';

// ---------------------------------------------------------------
// Barang (Item) schemas
// ---------------------------------------------------------------
export const itemSchema = z.object({
  id: z.number(),
  nama: z.string(),
  kode: z.string(),
  deskripsi: z.string().nullable(),
  harga_beli: z.number(), // decimal stored as numeric in DB, but we use number in TS
  harga_jual: z.number(),
  stok_saat_ini: z.number().int(),
  satuan: z.string(),
  created_at: z.coerce.date(),
});

export type Item = z.infer<typeof itemSchema>;

// Input schema for creating a new barang
export const createItemInputSchema = z.object({
  nama: z.string(),
  kode: z.string(),
  deskripsi: z.string().nullable(), // can be explicitly null
  harga_beli: z.number().positive(),
  harga_jual: z.number().positive(),
  satuan: z.string(),
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

// Input schema for updating an existing barang
export const updateItemInputSchema = z.object({
  id: z.number(),
  nama: z.string().optional(),
  kode: z.string().optional(),
  deskripsi: z.string().nullable().optional(),
  harga_beli: z.number().positive().optional(),
  harga_jual: z.number().positive().optional(),
  satuan: z.string().optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

// ---------------------------------------------------------------
// Transaksi Masuk (Inbound) schemas
// ---------------------------------------------------------------
export const inboundSchema = z.object({
  id: z.number(),
  barang_id: z.number(),
  tanggal_masuk: z.coerce.date(),
  jumlah: z.number().int().positive(),
  supplier: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Inbound = z.infer<typeof inboundSchema>;

export const createInboundInputSchema = z.object({
  barang_id: z.number(),
  tanggal_masuk: z.coerce.date(),
  jumlah: z.number().int().positive(),
  supplier: z.string().nullable(),
});

export type CreateInboundInput = z.infer<typeof createInboundInputSchema>;

// ---------------------------------------------------------------
// Transaksi Keluar (Outbound) schemas
// ---------------------------------------------------------------
export const outboundSchema = z.object({
  id: z.number(),
  barang_id: z.number(),
  tanggal_keluar: z.coerce.date(),
  jumlah: z.number().int().positive(),
  penerima: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Outbound = z.infer<typeof outboundSchema>;

export const createOutboundInputSchema = z.object({
  barang_id: z.number(),
  tanggal_keluar: z.coerce.date(),
  jumlah: z.number().int().positive(),
  penerima: z.string().nullable(),
});

export type CreateOutboundInput = z.infer<typeof createOutboundInputSchema>;
