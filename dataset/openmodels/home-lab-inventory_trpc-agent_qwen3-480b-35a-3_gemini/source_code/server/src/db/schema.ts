import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

// Hardware Assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  model: text('model').notNull(),
  serialNumber: text('serial_number').notNull(),
  location: text('location').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Software Assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  operatingSystem: text('operating_system').notNull(),
  host: text('host').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// IP Addresses table
export const ipAddressesTable = pgTable('ip_addresses', {
  id: serial('id').primaryKey(),
  address: text('address').notNull(),
  assignedTo: text('assigned_to').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IPAddress = typeof ipAddressesTable.$inferSelect;
export type NewIPAddress = typeof ipAddressesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  hardwareAssets: hardwareAssetsTable, 
  softwareAssets: softwareAssetsTable, 
  ipAddresses: ipAddressesTable 
};
