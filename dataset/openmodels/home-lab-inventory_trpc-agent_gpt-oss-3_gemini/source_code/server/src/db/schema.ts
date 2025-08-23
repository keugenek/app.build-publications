import { pgTable, serial, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enum definitions
export const hardwareTypeEnum = pgEnum('hardware_type', ['server', 'switch'] as const);
export const softwareTypeEnum = pgEnum('software_type', ['vm', 'container'] as const);

// Hardware assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: hardwareTypeEnum('type').notNull(),
  description: text('description'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Software assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: softwareTypeEnum('type').notNull(),
  host_id: integer('host_id').notNull().references(() => hardwareAssetsTable.id),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// IP allocations table
export const ipAllocationsTable = pgTable('ip_allocations', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  description: text('description'),
  hardware_asset_id: integer('hardware_asset_id').references(() => hardwareAssetsTable.id),
  software_asset_id: integer('software_asset_id').references(() => softwareAssetsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for selects/inserts
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IPAllocation = typeof ipAllocationsTable.$inferSelect;
export type NewIPAllocation = typeof ipAllocationsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  hardwareAssets: hardwareAssetsTable,
  softwareAssets: softwareAssetsTable,
  ipAllocations: ipAllocationsTable,
};
