import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * PostgreSQL enums matching Zod enums for strict type safety.
 */
export const hardwareTypeEnum = pgEnum('hardware_type', ['server', 'switch'] as const);
export const softwareTypeEnum = pgEnum('software_type', ['vm', 'container'] as const);
export const ipAllocationStatusEnum = pgEnum('ip_allocation_status', ['allocated', 'available'] as const);
export const allocationTargetTypeEnum = pgEnum('allocation_target_type', ['hardware', 'software'] as const);

/**
 * Hardware assets table.
 */
export const hardwareAssetsTable = pgTable('hardware_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: hardwareTypeEnum('type').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  serial_number: text('serial_number').notNull(),
  location: text('location').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Software assets table.
 */
export const softwareAssetsTable = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: softwareTypeEnum('type').notNull(),
  host_hardware_id: integer('host_hardware_id')
    .notNull()
    .references(() => hardwareAssetsTable.id),
  operating_system: text('operating_system').notNull(),
  purpose: text('purpose').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * IP allocation table.
 */
export const ipAllocationsTable = pgTable('ip_allocations', {
  id: serial('id').primaryKey(),
  ip_address: text('ip_address').notNull(),
  allocation_target_type: allocationTargetTypeEnum('allocation_target_type').notNull(),
  allocation_target_id: integer('allocation_target_id').notNull(),
  subnet: text('subnet').notNull(),
  status: ipAllocationStatusEnum('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Export TypeScript types for SELECT and INSERT operations.
 */
export type HardwareAsset = typeof hardwareAssetsTable.$inferSelect;
export type NewHardwareAsset = typeof hardwareAssetsTable.$inferInsert;

export type SoftwareAsset = typeof softwareAssetsTable.$inferSelect;
export type NewSoftwareAsset = typeof softwareAssetsTable.$inferInsert;

export type IPAllocation = typeof ipAllocationsTable.$inferSelect;
export type NewIPAllocation = typeof ipAllocationsTable.$inferInsert;

// Export all tables for relation queries.
export const tables = {
  hardwareAssets: hardwareAssetsTable,
  softwareAssets: softwareAssetsTable,
  ipAllocations: ipAllocationsTable,
};
