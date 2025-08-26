import { pgTable, serial, text, integer, date, time, boolean, foreignKey } from 'drizzle-orm/pg-core';

// ---------- Classes Table ----------
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  trainer: text('trainer').notNull(),
  capacity: integer('capacity').notNull(),
  date: date('date').notNull(), // DATE type
  time: time('time').notNull(), // TIME type
});

// ---------- Members Table ----------
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
});

// ---------- Reservations Table ----------
export const reservationsTable = pgTable('reservations', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id')
    .notNull()
    .references(() => classesTable.id),
  member_id: integer('member_id')
    .notNull()
    .references(() => membersTable.id),
  attended: boolean('attended'), // Nullable, default null until set
});

// Types for SELECT and INSERT operations
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Reservation = typeof reservationsTable.$inferSelect;
export type NewReservation = typeof reservationsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  classes: classesTable,
  members: membersTable,
  reservations: reservationsTable,
};
