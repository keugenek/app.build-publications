import { serial, text, pgTable, timestamp, numeric, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Cars table
export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  vin: text('vin').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance history table
export const maintenanceHistoryTable = pgTable('maintenance_history', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id),
  service_date: timestamp('service_date').notNull(),
  service_type: text('service_type').notNull(),
  mileage: integer('mileage').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Service reminders table
export const serviceRemindersTable = pgTable('service_reminders', {
  id: serial('id').primaryKey(),
  car_id: integer('car_id').notNull().references(() => carsTable.id),
  due_date: timestamp('due_date').notNull(),
  service_description: text('service_description').notNull(),
  is_completed: boolean('is_completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const carsRelations = relations(carsTable, ({ many }) => ({
  maintenanceHistory: many(maintenanceHistoryTable),
  serviceReminders: many(serviceRemindersTable),
}));

export const maintenanceHistoryRelations = relations(maintenanceHistoryTable, ({ one }) => ({
  car: one(carsTable, {
    fields: [maintenanceHistoryTable.car_id],
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

export type MaintenanceHistory = typeof maintenanceHistoryTable.$inferSelect;
export type NewMaintenanceHistory = typeof maintenanceHistoryTable.$inferInsert;

export type ServiceReminder = typeof serviceRemindersTable.$inferSelect;
export type NewServiceReminder = typeof serviceRemindersTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  cars: carsTable, 
  maintenanceHistory: maintenanceHistoryTable, 
  serviceReminders: serviceRemindersTable 
};
