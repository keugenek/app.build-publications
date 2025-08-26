import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum untuk jenis transaksi
export const jenisTransaksiEnum = pgEnum('jenis_transaksi', ['MASUK', 'KELUAR']);

// Tabel barang
export const barangTable = pgTable('barang', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  kode_barang: text('kode_barang').notNull().unique(),
  deskripsi: text('deskripsi'), // Nullable by default
  harga: numeric('harga', { precision: 15, scale: 2 }).notNull(),
  stok: integer('stok').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Tabel transaksi
export const transaksiTable = pgTable('transaksi', {
  id: serial('id').primaryKey(),
  tanggal: timestamp('tanggal').notNull(),
  barang_id: integer('barang_id').notNull().references(() => barangTable.id),
  jenis: jenisTransaksiEnum('jenis').notNull(),
  jumlah: integer('jumlah').notNull(),
  keterangan: text('keterangan'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const barangRelations = relations(barangTable, ({ many }) => ({
  transaksi: many(transaksiTable),
}));

export const transaksiRelations = relations(transaksiTable, ({ one }) => ({
  barang: one(barangTable, {
    fields: [transaksiTable.barang_id],
    references: [barangTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Barang = typeof barangTable.$inferSelect; // For SELECT operations
export type NewBarang = typeof barangTable.$inferInsert; // For INSERT operations

export type Transaksi = typeof transaksiTable.$inferSelect; // For SELECT operations  
export type NewTransaksi = typeof transaksiTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { 
  barang: barangTable, 
  transaksi: transaksiTable 
};
