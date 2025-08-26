import { serial, text, pgTable, timestamp, integer, pgEnum as drizzlePgEnum } from 'drizzle-orm/pg-core';

// Hardware asset types enum
export const hardwareTypeEnum = drizzlePgEnum('hardware_type', ['Server', 'Switch', 'Router', 'Storage']);

// Software asset types enum
export const softwareTypeEnum = drizzlePgEnum('software_type', ['VM', 'Container']);

// Device types enum for IP allocations
export const deviceTypeEnum = drizzlePgEnum('device_type', ['hardware', 'software']);

// Hardware assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: hardwareTypeEnum('type').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  serial_number: text('serial_number').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Software assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: softwareTypeEnum('type').notNull(),
  host_id: integer('host_id').notNull(),
  operating_system: text('operating_system').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// IP addresses table
export const ipAddressesTable = pgTable('ip_addresses', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  device_type: deviceTypeEnum('device_type').notNull(),
  device_id: integer('device_id').notNull(),
  description: text('description'),
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
