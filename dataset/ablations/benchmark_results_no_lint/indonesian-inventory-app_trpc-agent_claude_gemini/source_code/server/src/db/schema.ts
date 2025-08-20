import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for transaction types
export const jenisTransaksiEnum = pgEnum('jenis_transaksi', ['masuk', 'keluar']);

// Barang (Items) table
export const barangTable = pgTable('barang', {
  id: serial('id').primaryKey(),
  nama_barang: text('nama_barang').notNull(),
  kode_sku: text('kode_sku').notNull().unique(),
  jumlah_stok: integer('jumlah_stok').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transaksi (Transactions) table
export const transaksiTable = pgTable('transaksi', {
  id: serial('id').primaryKey(),
  kode_sku: text('kode_sku').notNull(),
  jenis_transaksi: jenisTransaksiEnum('jenis_transaksi').notNull(),
  jumlah: integer('jumlah').notNull(),
  tanggal_transaksi: timestamp('tanggal_transaksi').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const barangRelations = relations(barangTable, ({ many }) => ({
  transaksi: many(transaksiTable),
}));

export const transaksiRelations = relations(transaksiTable, ({ one }) => ({
  barang: one(barangTable, {
    fields: [transaksiTable.kode_sku],
    references: [barangTable.kode_sku],
  }),
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
