import { pgTable, serial, text, varchar, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------
// Tabel Barang (Item)
// ---------------------------------------------------------------
export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  nama: varchar('nama', { length: 255 }).notNull(),
  kode: varchar('kode', { length: 100 }).notNull().unique(),
  deskripsi: text('deskripsi'), // nullable by default
  harga_beli: numeric('harga_beli', { precision: 12, scale: 2 }).notNull(),
  harga_jual: numeric('harga_jual', { precision: 12, scale: 2 }).notNull(),
  stok_saat_ini: integer('stok_saat_ini').notNull().default(0),
  satuan: varchar('satuan', { length: 50 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------
// Tabel Transaksi Masuk (Inbound)
// ---------------------------------------------------------------
export const inboundTable = pgTable('inbound_transactions', {
  id: serial('id').primaryKey(),
  barang_id: integer('barang_id').notNull().references(() => itemsTable.id),
  tanggal_masuk: timestamp('tanggal_masuk').notNull(),
  jumlah: integer('jumlah').notNull(),
  supplier: varchar('supplier', { length: 255 }), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------
// Tabel Transaksi Keluar (Outbound)
// ---------------------------------------------------------------
export const outboundTable = pgTable('outbound_transactions', {
  id: serial('id').primaryKey(),
  barang_id: integer('barang_id').notNull().references(() => itemsTable.id),
  tanggal_keluar: timestamp('tanggal_keluar').notNull(),
  jumlah: integer('jumlah').notNull(),
  penerima: varchar('penerima', { length: 255 }), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT operations
export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;

export type Inbound = typeof inboundTable.$inferSelect;
export type NewInbound = typeof inboundTable.$inferInsert;

export type Outbound = typeof outboundTable.$inferSelect;
export type NewOutbound = typeof outboundTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  items: itemsTable,
  inbound: inboundTable,
  outbound: outboundTable,
};
