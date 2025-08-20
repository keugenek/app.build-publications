import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const birthdayCardsTable = pgTable('birthday_cards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  recipient_name: text('recipient_name').notNull(),
  sender_name: text('sender_name').notNull(),
  theme_color: text('theme_color').notNull().default('#ff69b4'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  card_id: integer('card_id').notNull(),
  image_url: text('image_url').notNull(),
  caption: text('caption'), // Nullable by default
  display_order: integer('display_order').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const birthdayCardsRelations = relations(birthdayCardsTable, ({ many }) => ({
  photos: many(photosTable),
}));

export const photosRelations = relations(photosTable, ({ one }) => ({
  card: one(birthdayCardsTable, {
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
