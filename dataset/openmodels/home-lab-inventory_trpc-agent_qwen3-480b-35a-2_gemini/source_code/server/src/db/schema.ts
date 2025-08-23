import { serial, text, pgTable, timestamp, integer, foreignKey } from 'drizzle-orm/pg-core';

// Hardware assets table
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['server', 'switch'] }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Software assets table
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['VM', 'container'] }).notNull(),
  description: text('description'),
  host_id: integer('host_id').notNull().references(() => hardwareAssetsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// IP addresses table
export const ipAddressesTable = pgTable('ip_addresses', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  status: text('status', { enum: ['allocated', 'free'] }).notNull(),
  hardware_asset_id: integer('hardware_asset_id').references(() => hardwareAssetsTable.id),
  software_asset_id: integer('software_asset_id').references(() => softwareAssetsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure an IP is linked to either hardware or software asset, but not both
    hardwareAssetFk: foreignKey({
      columns: [table.hardware_asset_id],
      foreignColumns: [hardwareAssetsTable.id]
    }).onDelete('set null'),
    softwareAssetFk: foreignKey({
      columns: [table.software_asset_id],
      foreignColumns: [softwareAssetsTable.id]
    }).onDelete('set null')
  };
});

// TypeScript types for the table schemas
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IpAddress = typeof ipAddressesTable.$inferSelect;
export type NewIpAddress = typeof ipAddressesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  hardwareAssets: hardwareAssetsTable, 
  softwareAssets: softwareAssetsTable, 
  ipAddresses: ipAddressesTable 
};
