import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const birthdayCardsTable = pgTable('birthday_cards', {
  id: serial('id').primaryKey(),
  recipientName: text('recipient_name').notNull(),
  message: text('message').notNull(),
  senderName: text('sender_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  cardId: integer('card_id').notNull().references(() => birthdayCardsTable.id),
  url: text('url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type BirthdayCard = typeof birthdayCardsTable.$inferSelect;
export type NewBirthdayCard = typeof birthdayCardsTable.$inferInsert;

export type Photo = typeof photosTable.$inferSelect;
export type NewPhoto = typeof photosTable.$inferInsert;

// Export all tables for relation queries
export const tables = { birthdayCards: birthdayCardsTable, photos: photosTable };