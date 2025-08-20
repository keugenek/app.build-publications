import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for stock movement types
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['stock-in', 'stock-out']);

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(), // SKU should be unique
  stock_level: integer('stock_level').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Stock movements table
export const stockMovementsTable = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  movement_type: stockMovementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  stockMovements: many(stockMovementsTable),
}));

export const stockMovementsRelations = relations(stockMovementsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [stockMovementsTable.product_id],
    references: [productsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
export type NewStockMovement = typeof stockMovementsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  products: productsTable, 
  stockMovements: stockMovementsTable 
};
