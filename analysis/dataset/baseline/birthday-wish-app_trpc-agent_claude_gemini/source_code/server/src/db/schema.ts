import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Birthday cards table
export const birthdayCardsTable = pgTable('birthday_cards', {
  id: serial('id').primaryKey(),
  recipient_name: text('recipient_name').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Photos table for gallery images
export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  card_id: integer('card_id').notNull().references(() => birthdayCardsTable.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  original_name: varchar('original_name', { length: 255 }).notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  caption: text('caption'), // Nullable by default
  display_order: integer('display_order').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations between tables
export const birthdayCardsRelations = relations(birthdayCardsTable, ({ many }) => ({
  photos: many(photosTable),
}));

export const photosRelations = relations(photosTable, ({ one }) => ({
  birthdayCard: one(birthdayCardsTable, {
    fields: [photosTable.card_id],
    references: [birthdayCardsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type BirthdayCard = typeof birthdayCardsTable.$inferSelect;
export type NewBirthdayCard = typeof birthdayCardsTable.$inferInsert;
export type Photo = typeof photosTable.$inferSelect;
export type NewPhoto = typeof photosTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  birthdayCards: birthdayCardsTable,
  photos: photosTable
};
