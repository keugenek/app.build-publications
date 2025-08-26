import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

describe('getProducts handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const products = await getProducts();
    expect(products).toBeInstanceOf(Array);
    expect(products).toHaveLength(0);
  });

  it('should fetch products from the database', async () => {
    // Insert a test product directly
    const insertResult = await db
      .insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TP-001',
        stock_quantity: 42,
      })
      .returning()
      .execute();

    const inserted: Product = insertResult[0];
    expect(inserted.id).toBeDefined();
    expect(inserted.created_at).toBeInstanceOf(Date);

    const products = await getProducts();
    // Should contain at least the inserted product
    const fetched = products.find(p => p.id === inserted.id);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Test Product');
    expect(fetched?.sku).toBe('TP-001');
    expect(fetched?.stock_quantity).toBe(42);
    expect(fetched?.created_at).toBeInstanceOf(Date);
  });
});
