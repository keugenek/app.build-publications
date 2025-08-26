import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const serviceTypeEnum = pgEnum('service_type', [
  'oil_change',
  'tire_rotation',
  'brake_service',
  'transmission_service',
  'engine_tune_up',
  'air_filter_replacement',
  'battery_replacement',
  'coolant_service',
  'inspection',
  'other'
]);

export const reminderTypeEnum = pgEnum('reminder_type', ['date_based', 'mileage_based']);

// Cars table
export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  license_plate: text('license_plate').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance entries table
export const maintenanceEntriesTable = pgTable('maintenance_entries', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id, { onDelete: 'cascade' }),
  service_date: timestamp('service_date').notNull(),
  mileage: integer('mileage').notNull(),
  service_type: serviceTypeEnum('service_type').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Service reminders table
export const serviceRemindersTable = pgTable('service_reminders', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id, { onDelete: 'cascade' }),
  service_type: serviceTypeEnum('service_type').notNull(),
  reminder_type: reminderTypeEnum('reminder_type').notNull(),
  due_date: timestamp('due_date'), // Nullable - only for date-based reminders
  due_mileage: integer('due_mileage'), // Nullable - only for mileage-based reminders
  is_completed: boolean('is_completed').notNull().default(false),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const carsRelations = relations(carsTable, ({ many }) => ({
  maintenanceEntries: many(maintenanceEntriesTable),
  serviceReminders: many(serviceRemindersTable),
}));

export const maintenanceEntriesRelations = relations(maintenanceEntriesTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [maintenanceEntriesTable.car_id],
    references: [carsTable.id],
  }),
}));

export const serviceRemindersRelations = relations(serviceRemindersTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [serviceRemindersTable.car_id],
    references: [carsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect;
export type NewCar = typeof carsTable.$inferInsert;

export type MaintenanceEntry = typeof maintenanceEntriesTable.$inferSelect;
export type NewMaintenanceEntry = typeof maintenanceEntriesTable.$inferInsert;

export type ServiceReminder = typeof serviceRemindersTable.$inferSelect;
export type NewServiceReminder = typeof serviceRemindersTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  cars: carsTable,
  maintenanceEntries: maintenanceEntriesTable,
  serviceReminders: serviceRemindersTable,
};
