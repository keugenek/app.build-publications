import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Service type enum
export const serviceTypeEnum = pgEnum('service_type', [
  'oil_change',
  'tire_rotation',
  'brake_service',
  'engine_tune_up',
  'transmission_service',
  'coolant_flush',
  'air_filter_replacement',
  'battery_replacement',
  'inspection',
  'other'
]);

// Cars table
export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  vin: text('vin'), // Nullable by default
  license_plate: text('license_plate'), // Nullable by default
  current_mileage: integer('current_mileage').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance records table
export const maintenanceRecordsTable = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').references(() => carsTable.id).notNull(),
  service_date: timestamp('service_date').notNull(),
  service_type: serviceTypeEnum('service_type').notNull(),
  description: text('description').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values
  mileage: integer('mileage').notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Upcoming services table
export const upcomingServicesTable = pgTable('upcoming_services', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').references(() => carsTable.id).notNull(),
  service_type: serviceTypeEnum('service_type').notNull(),
  description: text('description').notNull(),
  due_date: timestamp('due_date').notNull(),
  due_mileage: integer('due_mileage'), // Nullable by default
  is_completed: boolean('is_completed').default(false).notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const carsRelations = relations(carsTable, ({ many }) => ({
  maintenanceRecords: many(maintenanceRecordsTable),
  upcomingServices: many(upcomingServicesTable),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecordsTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [maintenanceRecordsTable.car_id],
    references: [carsTable.id],
  }),
}));

export const upcomingServicesRelations = relations(upcomingServicesTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [upcomingServicesTable.car_id],
    references: [carsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;
export type MaintenanceRecord = typeof maintenanceRecordsTable.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecordsTable.$inferInsert;
export type UpcomingService = typeof upcomingServicesTable.$inferSelect;
export type NewUpcomingService = typeof upcomingServicesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  cars: carsTable,
  maintenanceRecords: maintenanceRecordsTable,
  upcomingServices: upcomingServicesTable
};
