import { serial, text, pgTable, timestamp, numeric, integer, date, foreignKey } from 'drizzle-orm/pg-core';

export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  licensePlate: text('license_plate').notNull(),
  vin: text('vin').notNull(),
  nextServiceDate: date('next_service_date'),
  nextServiceMileage: integer('next_service_mileage'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const maintenanceEntriesTable = pgTable('maintenance_entries', {
  id: serial('id').primaryKey(),
  carId: integer('car_id').notNull().references(() => carsTable.id),
  dateOfService: date('date_of_service').notNull(),
  serviceType: text('service_type').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  mileage: integer('mileage').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;

export type MaintenanceEntry = typeof maintenanceEntriesTable.$inferSelect;
export type NewMaintenanceEntry = typeof maintenanceEntriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { cars: carsTable, maintenanceEntries: maintenanceEntriesTable };
