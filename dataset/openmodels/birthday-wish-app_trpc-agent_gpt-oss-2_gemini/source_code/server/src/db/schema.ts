import { pgTable, serial, text, timestamp, pgEnum, varchar } from 'drizzle-orm/pg-core';

// Enum for animation types
export const animationEnum = pgEnum('animation_type', ['confetti', 'balloons', 'fireworks'] as const);

export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  message: text('message').notNull(),
  animation_type: animationEnum('animation_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  card_id: serial('card_id')
    .references(() => cards.id)
    .notNull(),
  url: text('url').notNull(),
  caption: text('caption'), // nullable by default
});

// Export table types for convenience
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

// Export tables object for relation queries (used in db/index.ts)
export const tables = { cards, photos };
