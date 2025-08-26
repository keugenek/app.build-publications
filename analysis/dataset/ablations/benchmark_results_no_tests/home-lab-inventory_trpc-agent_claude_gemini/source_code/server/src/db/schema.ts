import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const hardwareTypeEnum = pgEnum('hardware_type', [
  'server', 
  'network_switch', 
  'router', 
  'firewall', 
  'storage', 
  'other'
]);

export const hardwareStatusEnum = pgEnum('hardware_status', [
  'active', 
  'inactive', 
  'maintenance', 
  'decommissioned'
]);

export const softwareTypeEnum = pgEnum('software_type', [
  'virtual_machine', 
  'container', 
  'service', 
  'application', 
  'other'
]);

export const softwareStatusEnum = pgEnum('software_status', [
  'running', 
  'stopped', 
  'paused', 
  'error'
]);

export const assignmentTypeEnum = pgEnum('assignment_type', [
  'hardware', 
  'software'
]);

// Hardware Assets Table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: hardwareTypeEnum('type').notNull(),
  status: hardwareStatusEnum('status').notNull().default('active'),
  model: text('model'),
  manufacturer: text('manufacturer'),
  serial_number: text('serial_number'),
  location: text('location'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Software Assets Table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: softwareTypeEnum('type').notNull(),
  status: softwareStatusEnum('status').notNull().default('stopped'),
  host_hardware_id: integer('host_hardware_id').references(() => hardwareAssetsTable.id),
  operating_system: text('operating_system'),
  version: text('version'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// IP Addresses Table
export const ipAddressesTable = pgTable('ip_addresses', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  subnet: text('subnet').notNull(),
  assignment_type: assignmentTypeEnum('assignment_type').notNull(),
  hardware_asset_id: integer('hardware_asset_id').references(() => hardwareAssetsTable.id),
  software_asset_id: integer('software_asset_id').references(() => softwareAssetsTable.id),
  description: text('description'),
  is_reserved: boolean('is_reserved').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const hardwareAssetsRelations = relations(hardwareAssetsTable, ({ many }) => ({
  softwareAssets: many(softwareAssetsTable),
  ipAddresses: many(ipAddressesTable)
}));

export const softwareAssetsRelations = relations(softwareAssetsTable, ({ one, many }) => ({
  hostHardware: one(hardwareAssetsTable, {
    fields: [softwareAssetsTable.host_hardware_id],
    references: [hardwareAssetsTable.id]
  }),
  ipAddresses: many(ipAddressesTable)
}));

export const ipAddressesRelations = relations(ipAddressesTable, ({ one }) => ({
  hardwareAsset: one(hardwareAssetsTable, {
    fields: [ipAddressesTable.hardware_asset_id],
    references: [hardwareAssetsTable.id]
  }),
  softwareAsset: one(softwareAssetsTable, {
    fields: [ipAddressesTable.software_asset_id],
    references: [softwareAssetsTable.id]
  })
}));

// TypeScript types for the table schemas
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IpAddress = typeof ipAddressesTable.$inferSelect;
export type NewIpAddress = typeof ipAddressesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  hardwareAssets: hardwareAssetsTable,
  softwareAssets: softwareAssetsTable,
  ipAddresses: ipAddressesTable
};
