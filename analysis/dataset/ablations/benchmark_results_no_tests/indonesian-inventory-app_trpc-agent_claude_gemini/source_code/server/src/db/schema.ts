import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum untuk jenis transaksi
export const jenisTransaksiEnum = pgEnum('jenis_transaksi', ['masuk', 'keluar']);

// Tabel barang
export const barangTable = pgTable('barang', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  kode: text('kode').notNull().unique(),
  jumlah_stok: integer('jumlah_stok').notNull().default(0),
  deskripsi: text('deskripsi'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tabel transaksi
export const transaksiTable = pgTable('transaksi', {
  id: serial('id').primaryKey(),
  jenis: jenisTransaksiEnum('jenis').notNull(),
  barang_id: integer('barang_id').notNull().references(() => barangTable.id),
  nama_barang: text('nama_barang').notNull(), // Denormalized untuk performa query
  jumlah: integer('jumlah').notNull(),
  tanggal_transaksi: timestamp('tanggal_transaksi').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relasi antara barang dan transaksi
export const barangRelations = relations(barangTable, ({ many }) => ({
  transaksi: many(transaksiTable),
}));

export const transaksiRelations = relations(transaksiTable, ({ one }) => ({
  barang: one(barangTable, {
    fields: [transaksiTable.barang_id],
    references: [barangTable.id],
  }),
}));

// TypeScript types untuk table schema
export type Barang = typeof barangTable.$inferSelect;
export type NewBarang = typeof barangTable.$inferInsert;
export type Transaksi = typeof transaksiTable.$inferSelect;
export type NewTransaksi = typeof transaksiTable.$inferInsert;

// Export semua tabel dan relasi untuk query building
export const tables = { 
  barang: barangTable, 
  transaksi: transaksiTable 
};

export const tableRelations = {
  barangRelations,
  transaksiRelations
};
