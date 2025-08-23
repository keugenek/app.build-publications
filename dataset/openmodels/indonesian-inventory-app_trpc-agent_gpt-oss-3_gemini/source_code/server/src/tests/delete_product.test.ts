import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { deleteProduct } from '../handlers/delete_product';

// Helper to create a product via direct DB insert (bypassing stub)
const insertProduct = async (input: CreateProductInput) => {
  const result = await db.insert(productsTable)
    .values({
      nama: input.nama,
      deskripsi: input.deskripsi ?? null,
      jumlah_stok: input.jumlah_stok ?? 0,
      harga_satuan: input.harga_satuan.toString(),
      kode_sku: input.kode_sku,
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteProduct', async () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product and return its data', async () => {
    const testInput: CreateProductInput = {
      nama: 'Test Delete',
      deskripsi: 'To be deleted',
      jumlah_stok: 5,
      harga_satuan: 10.5,
      kode_sku: 'DEL-001',
    };

    const inserted = await insertProduct(testInput);

    const deleted = await deleteProduct(inserted.id);

    expect(deleted.id).toBe(inserted.id);
    expect(deleted.nama).toBe('Test Delete');
    expect(deleted.harga_satuan).toBe(10.5);
    expect(deleted.kode_sku).toBe('DEL-001');

    // Ensure product no longer exists in DB
    const remaining = await db.select().from(productsTable).where(eq(productsTable.id, inserted.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when product does not exist', async () => {
    await expect(deleteProduct('non-existent-id')).rejects.toThrow(/Product not found/i);
  });
});
