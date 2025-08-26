import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for transaction types
export const jenisTransaksiEnum = pgEnum('jenis_transaksi', ['Masuk', 'Keluar']);

// Barang (Items) table
export const barangTable = pgTable('barang', {
  id: serial('id').primaryKey(),
  nama_barang: text('nama_barang').notNull(),
  kode_barang: text('kode_barang').notNull().unique(),
  deskripsi: text('deskripsi'), // Nullable by default
  jumlah_stok: integer('jumlah_stok').notNull().default(0),
  harga_beli: numeric('harga_beli', { precision: 15, scale: 2 }), // Nullable by default
  harga_jual: numeric('harga_jual', { precision: 15, scale: 2 }), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Transaksi (Transactions) table
export const transaksiTable = pgTable('transaksi', {
  id: serial('id').primaryKey(),
  tanggal_transaksi: timestamp('tanggal_transaksi').notNull(),
  jenis_transaksi: jenisTransaksiEnum('jenis_transaksi').notNull(),
  barang_id: integer('barang_id').notNull().references(() => barangTable.id),
  jumlah: integer('jumlah').notNull(),
  catatan: text('catatan'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const barangRelations = relations(barangTable, ({ many }) => ({
  transaksi: many(transaksiTable)
}));

export const transaksiRelations = relations(transaksiTable, ({ one }) => ({
  barang: one(barangTable, {
    fields: [transaksiTable.barang_id],
    references: [barangTable.id]
  })
}));

// TypeScript types for the table schemas
export type Barang = typeof barangTable.$inferSelect;
export type NewBarang = typeof barangTable.$inferInsert;
export type Transaksi = typeof transaksiTable.$inferSelect;
export type NewTransaksi = typeof transaksiTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  barang: barangTable,
  transaksi: transaksiTable
};

export const tableRelations = {
  barangRelations,
  transaksiRelations
};
