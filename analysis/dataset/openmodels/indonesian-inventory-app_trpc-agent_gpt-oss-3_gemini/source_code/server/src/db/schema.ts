import { pgTable, uuid, text, integer, numeric, timestamp, foreignKey } from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// Product (Barang) table
// -----------------------------------------------------------------------------
export const productsTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'), // nullable by default
  jumlah_stok: integer('jumlah_stok').notNull().default(0),
  harga_satuan: numeric('harga_satuan', { precision: 10, scale: 2 }).notNull(),
  kode_sku: text('kode_sku').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// Transaction (Transaksi) table
// -----------------------------------------------------------------------------
export const transactionsTable = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tanggal: timestamp('tanggal').notNull(),
  jenis: text('jenis').notNull(), // 'masuk' or 'keluar'
  produk_id: uuid('produk_id').notNull(),
  jumlah: integer('jumlah').notNull(),
  pihak_terlibat: text('pihak_terlibat'), // nullable
  nomor_referensi: text('nomor_referensi'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    productFk: foreignKey({
      columns: [table.produk_id],
      foreignColumns: [productsTable.id],
    }),
  };
});

// Export types for convenience
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  products: productsTable,
  transactions: transactionsTable,
};
