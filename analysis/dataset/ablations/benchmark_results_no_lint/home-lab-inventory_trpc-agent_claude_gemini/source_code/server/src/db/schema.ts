import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Hardware Assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  serial_number: text('serial_number'), // Nullable
  description: text('description'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Software Assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  hardware_asset_id: integer('hardware_asset_id'), // Nullable foreign key
  operating_system: text('operating_system'), // Nullable
  purpose: text('purpose'), // Nullable
  resource_allocation: text('resource_allocation'), // Nullable
  ip_address_id: integer('ip_address_id'), // Nullable foreign key
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// IP Address Allocations table
export const ipAddressAllocationsTable = pgTable('ip_address_allocations', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  purpose: text('purpose'), // Nullable
  assigned_hardware_id: integer('assigned_hardware_id'), // Nullable foreign key
  assigned_software_id: integer('assigned_software_id'), // Nullable foreign key
  status: text('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const hardwareAssetsRelations = relations(hardwareAssetsTable, ({ many }) => ({
  softwareAssets: many(softwareAssetsTable),
  ipAddressAllocations: many(ipAddressAllocationsTable)
}));

export const softwareAssetsRelations = relations(softwareAssetsTable, ({ one }) => ({
  hardwareAsset: one(hardwareAssetsTable, {
    fields: [softwareAssetsTable.hardware_asset_id],
    references: [hardwareAssetsTable.id]
  }),
  ipAddressAllocation: one(ipAddressAllocationsTable, {
    fields: [softwareAssetsTable.ip_address_id],
    references: [ipAddressAllocationsTable.id]
  })
}));

export const ipAddressAllocationsRelations = relations(ipAddressAllocationsTable, ({ one, many }) => ({
  assignedHardware: one(hardwareAssetsTable, {
    fields: [ipAddressAllocationsTable.assigned_hardware_id],
    references: [hardwareAssetsTable.id]
  }),
  assignedSoftware: one(softwareAssetsTable, {
    fields: [ipAddressAllocationsTable.assigned_software_id],
    references: [softwareAssetsTable.id]
  }),
  softwareAssets: many(softwareAssetsTable)
}));

// TypeScript types for the table schemas
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IpAddressAllocation = typeof ipAddressAllocationsTable.$inferSelect;
export type NewIpAddressAllocation = typeof ipAddressAllocationsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  hardwareAssets: hardwareAssetsTable,
  softwareAssets: softwareAssetsTable,
  ipAddressAllocations: ipAddressAllocationsTable
};
