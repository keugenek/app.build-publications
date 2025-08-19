import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for hardware and software types
export const hardwareTypeEnum = pgEnum('hardware_type', ['server', 'switch', 'router', 'firewall', 'storage', 'other']);
export const softwareTypeEnum = pgEnum('software_type', ['vm', 'container', 'service', 'application', 'other']);

// Hardware assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: hardwareTypeEnum('type').notNull(),
  make: text('make'), // Nullable by default
  model: text('model'), // Nullable by default
  location: text('location'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Software assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: softwareTypeEnum('type').notNull(),
  host_id: integer('host_id'), // Foreign key to hardware_assets, nullable
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// IP allocations table
export const ipAllocationsTable = pgTable('ip_allocations', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull().unique(), // IP addresses should be unique
  asset_name: text('asset_name').notNull(),
  hardware_asset_id: integer('hardware_asset_id'), // Optional foreign key to hardware_assets
  software_asset_id: integer('software_asset_id'), // Optional foreign key to software_assets
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations
export const hardwareAssetsRelations = relations(hardwareAssetsTable, ({ many }) => ({
  softwareAssets: many(softwareAssetsTable),
  ipAllocations: many(ipAllocationsTable)
}));

export const softwareAssetsRelations = relations(softwareAssetsTable, ({ one, many }) => ({
  host: one(hardwareAssetsTable, {
    fields: [softwareAssetsTable.host_id],
    references: [hardwareAssetsTable.id]
  }),
  ipAllocations: many(ipAllocationsTable)
}));

export const ipAllocationsRelations = relations(ipAllocationsTable, ({ one }) => ({
  hardwareAsset: one(hardwareAssetsTable, {
    fields: [ipAllocationsTable.hardware_asset_id],
    references: [hardwareAssetsTable.id]
  }),
  softwareAsset: one(softwareAssetsTable, {
    fields: [ipAllocationsTable.software_asset_id],
    references: [softwareAssetsTable.id]
  })
}));

// TypeScript types for the table schemas
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IpAllocation = typeof ipAllocationsTable.$inferSelect;
export type NewIpAllocation = typeof ipAllocationsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  hardwareAssets: hardwareAssetsTable,
  softwareAssets: softwareAssetsTable,
  ipAllocations: ipAllocationsTable
};
