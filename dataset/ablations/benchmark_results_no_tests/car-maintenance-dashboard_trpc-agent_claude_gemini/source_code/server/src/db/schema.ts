import { serial, text, pgTable, timestamp, integer, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enum for interval types
export const intervalTypeEnum = pgEnum('interval_type', ['mileage', 'time']);

// Cars table
export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  license_plate: text('license_plate').notNull(),
  current_mileage: integer('current_mileage').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Maintenance entries table
export const maintenanceEntriesTable = pgTable('maintenance_entries', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').references(() => carsTable.id).notNull(),
  service_date: timestamp('service_date').notNull(),
  service_type: text('service_type').notNull(),
  description: text('description'), // Nullable by default
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  mileage_at_service: integer('mileage_at_service').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Service schedules table for tracking upcoming services
export const serviceSchedulesTable = pgTable('service_schedules', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').references(() => carsTable.id).notNull(),
  service_type: text('service_type').notNull(),
  interval_type: intervalTypeEnum('interval_type').notNull(),
  interval_value: integer('interval_value').notNull(), // miles or months
  last_service_date: timestamp('last_service_date'), // Nullable
  last_service_mileage: integer('last_service_mileage'), // Nullable
  next_service_date: timestamp('next_service_date'), // Nullable - calculated field
  next_service_mileage: integer('next_service_mileage'), // Nullable - calculated field
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const carsRelations = relations(carsTable, ({ many }) => ({
  maintenanceEntries: many(maintenanceEntriesTable),
  serviceSchedules: many(serviceSchedulesTable),
}));

export const maintenanceEntriesRelations = relations(maintenanceEntriesTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [maintenanceEntriesTable.car_id],
    references: [carsTable.id],
  }),
}));

export const serviceSchedulesRelations = relations(serviceSchedulesTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [serviceSchedulesTable.car_id],
    references: [carsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;

export type MaintenanceEntry = typeof maintenanceEntriesTable.$inferSelect;
export type NewMaintenanceEntry = typeof maintenanceEntriesTable.$inferInsert;

export type ServiceSchedule = typeof serviceSchedulesTable.$inferSelect;
export type NewServiceSchedule = typeof serviceSchedulesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = {
  cars: carsTable,
  maintenanceEntries: maintenanceEntriesTable,
  serviceSchedules: serviceSchedulesTable,
};
