import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const birthdayCardsTable = pgTable('birthday_cards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  recipient_name: text('recipient_name').notNull(),
  sender_name: text('sender_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  is_active: boolean('is_active').default(true).notNull(),
});

export const galleryImagesTable = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  card_id: integer('card_id').references(() => birthdayCardsTable.id).notNull(),
  image_url: text('image_url').notNull(),
  alt_text: text('alt_text').notNull(),
  display_order: integer('display_order').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const birthdayCardsRelations = relations(birthdayCardsTable, ({ many }) => ({
  images: many(galleryImagesTable),
}));

export const galleryImagesRelations = relations(galleryImagesTable, ({ one }) => ({
  card: one(birthdayCardsTable, {
    fields: [galleryImagesTable.card_id],
    references: [birthdayCardsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type BirthdayCard = typeof birthdayCardsTable.$inferSelect;
export type NewBirthdayCard = typeof birthdayCardsTable.$inferInsert;
export type GalleryImage = typeof galleryImagesTable.$inferSelect;
export type NewGalleryImage = typeof galleryImagesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  birthdayCards: birthdayCardsTable,
  galleryImages: galleryImagesTable
};
