import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  vin: text('vin').notNull(),
  current_mileage: integer('current_mileage').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const maintenanceEntriesTable = pgTable('maintenance_entries', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id),
  date: timestamp('date').notNull(),
  service_type: text('service_type').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  mileage_at_service: integer('mileage_at_service').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;

export type MaintenanceEntry = typeof maintenanceEntriesTable.$inferSelect;
export type NewMaintenanceEntry = typeof maintenanceEntriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { cars: carsTable, maintenanceEntries: maintenanceEntriesTable };
