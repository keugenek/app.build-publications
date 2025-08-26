import { serial, text, pgTable, timestamp, integer, pgEnum as drizzleEnum } from 'drizzle-orm/pg-core';

// Define celebration type enum
export const celebrationTypeEnum = drizzleEnum('celebration_type', ['confetti', 'balloons', 'both']);

// Birthday cards table
export const birthdayCardsTable = pgTable('birthday_cards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  recipientName: text('recipient_name').notNull(),
  celebrationType: celebrationTypeEnum('celebration_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Photos table
export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  cardId: integer('card_id').references(() => birthdayCardsTable.id).notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type BirthdayCard = typeof birthdayCardsTable.$inferSelect;
export type NewBirthdayCard = typeof birthdayCardsTable.$inferInsert;

export type Photo = typeof photosTable.$inferSelect;
export type NewPhoto = typeof photosTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  birthdayCards: birthdayCardsTable, 
  photos: photosTable 
};