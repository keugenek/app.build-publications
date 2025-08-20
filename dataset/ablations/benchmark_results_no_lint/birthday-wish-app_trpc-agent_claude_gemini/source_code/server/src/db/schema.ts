import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for birthday card themes
export const themeEnum = pgEnum('theme', ['confetti', 'balloons', 'sparkles']);

// Birthday cards table
export const birthdayCardsTable = pgTable('birthday_cards', {
  id: serial('id').primaryKey(),
  recipient_name: text('recipient_name').notNull(),
  message: text('message').notNull(),
  sender_name: text('sender_name').notNull(),
  theme: themeEnum('theme').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Photos table for the gallery
export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  card_id: integer('card_id').notNull().references(() => birthdayCardsTable.id, { onDelete: 'cascade' }),
  image_url: text('image_url').notNull(),
  caption: text('caption'), // Nullable by default
  display_order: integer('display_order').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relationships
export const birthdayCardsRelations = relations(birthdayCardsTable, ({ many }) => ({
  photos: many(photosTable)
}));

export const photosRelations = relations(photosTable, ({ one }) => ({
  card: one(birthdayCardsTable, {
    fields: [photosTable.card_id],
    references: [birthdayCardsTable.id]
  })
}));

// TypeScript types for the table schemas
export type BirthdayCard = typeof birthdayCardsTable.$inferSelect; // For SELECT operations
export type NewBirthdayCard = typeof birthdayCardsTable.$inferInsert; // For INSERT operations

export type Photo = typeof photosTable.$inferSelect; // For SELECT operations
export type NewPhoto = typeof photosTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { 
  birthdayCards: birthdayCardsTable, 
  photos: photosTable 
};
