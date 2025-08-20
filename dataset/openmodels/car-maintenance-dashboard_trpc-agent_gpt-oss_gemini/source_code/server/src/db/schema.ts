import { serial, text, timestamp, integer, numeric, pgTable } from 'drizzle-orm/pg-core';

export const maintenanceRecordsTable = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  service_date: timestamp('service_date').notNull(),
  service_type: text('service_type').notNull(),
  mileage: integer('mileage').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecordsTable.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecordsTable.$inferInsert;

export const remindersTable = pgTable('reminders', {
  id: serial('id').primaryKey(),
  due_date: timestamp('due_date').notNull(),
  service_type: text('service_type').notNull(),
  notes: text('notes'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Reminder = typeof remindersTable.$inferSelect;
export type NewReminder = typeof remindersTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  maintenance_records: maintenanceRecordsTable,
  reminders: remindersTable,
};
