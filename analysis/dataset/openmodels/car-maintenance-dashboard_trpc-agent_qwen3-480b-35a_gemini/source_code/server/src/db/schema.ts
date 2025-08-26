import { serial, text, pgTable, timestamp, integer, numeric, foreignKey, date } from 'drizzle-orm/pg-core';

export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  license_plate: text('license_plate').notNull().unique(),
  vin: text('vin').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const maintenanceRecordsTable = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id),
  service_type: text('service_type').notNull(),
  date: date('date').notNull(),
  mileage: integer('mileage').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const upcomingServicesTable = pgTable('upcoming_services', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id),
  service_type: text('service_type').notNull(),
  due_date: date('due_date'),
  due_mileage: integer('due_mileage'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;

export type MaintenanceRecord = typeof maintenanceRecordsTable.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecordsTable.$inferInsert;

export type UpcomingService = typeof upcomingServicesTable.$inferSelect;
export type NewUpcomingService = typeof upcomingServicesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  cars: carsTable, 
  maintenanceRecords: maintenanceRecordsTable, 
  upcomingServices: upcomingServicesTable 
};
