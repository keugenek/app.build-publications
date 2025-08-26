import { pgTable, serial, text, integer, timestamp, numeric, date, pgEnum } from 'drizzle-orm/pg-core';

// Car table
export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  license_plate: text('license_plate').unique().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance record table
export const maintenanceRecordsTable = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id),
  service_date: timestamp('service_date').notNull(),
  service_type: text('service_type').notNull(),
  odometer: integer('odometer').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'), // nullable by default
  next_service_due: timestamp('next_service_due'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;
export type MaintenanceRecord = typeof maintenanceRecordsTable.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecordsTable.$inferInsert;

export const tables = { cars: carsTable, maintenanceRecords: maintenanceRecordsTable };
