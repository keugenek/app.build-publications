import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Hardware assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // e.g., "Server", "Switch", "Router", "Storage"
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Software assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // e.g., "VM", "Container", "Service"
  description: text('description'), // Nullable by default
  hardware_asset_id: integer('hardware_asset_id'), // Foreign key to hardware_assets, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// IP addresses table
export const ipAddressesTable = pgTable('ip_addresses', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  subnet_mask: text('subnet_mask').notNull(),
  hardware_asset_id: integer('hardware_asset_id'), // Foreign key to hardware_assets, nullable
  software_asset_id: integer('software_asset_id'), // Foreign key to software_assets, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations for proper query building
export const hardwareAssetsRelations = relations(hardwareAssetsTable, ({ many }) => ({
  softwareAssets: many(softwareAssetsTable),
  ipAddresses: many(ipAddressesTable),
}));

export const softwareAssetsRelations = relations(softwareAssetsTable, ({ one, many }) => ({
  hardwareAsset: one(hardwareAssetsTable, {
    fields: [softwareAssetsTable.hardware_asset_id],
    references: [hardwareAssetsTable.id],
  }),
  ipAddresses: many(ipAddressesTable),
}));

export const ipAddressesRelations = relations(ipAddressesTable, ({ one }) => ({
  hardwareAsset: one(hardwareAssetsTable, {
    fields: [ipAddressesTable.hardware_asset_id],
    references: [hardwareAssetsTable.id],
  }),
  softwareAsset: one(softwareAssetsTable, {
    fields: [ipAddressesTable.software_asset_id],
    references: [softwareAssetsTable.id],
  }),
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
  ipAddresses: ipAddressesTable,
};

export const tableRelations = {
  hardwareAssetsRelations,
  softwareAssetsRelations,
  ipAddressesRelations,
};
