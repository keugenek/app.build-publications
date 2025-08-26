import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

/** Helper to insert a product directly into DB */
const insertProduct = async (overrides?: Partial<Product>): Promise<Product> => {
  const base = {
    nama: 'Original Product',
    deskripsi: 'Original description',
    jumlah_stok: 10,
    harga_satuan: '5.00', // stored as string for numeric column
    kode_sku: 'sku-original',
  } as any;

  const values = { ...base, ...overrides };

  const result = await db
    .insert(productsTable)
    .values({
      ...values,
      // Ensure harga_satuan is string when inserting
      harga_satuan: values.harga_satuan,
    })
    .returning()
    .execute();

  // Convert numeric field to number for consistency with schema type
  const prod = result[0] as any;
  prod.harga_satuan = parseFloat(prod.harga_satuan);
  return prod as Product;
};

describe('updateProduct handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates all provided fields correctly', async () => {
    const original = await insertProduct();

    const updateInput: UpdateProductInput = {
      id: original.id,
      nama: 'Updated Name',
      deskripsi: null,
      jumlah_stok: 20,
      harga_satuan: 7.55,
      kode_sku: 'sku-updated',
    };

    const updated = await updateProduct(updateInput);

    // Verify returned object
    expect(updated.id).toBe(original.id);
    expect(updated.nama).toBe('Updated Name');
    expect(updated.deskripsi).toBeNull();
    expect(updated.jumlah_stok).toBe(20);
    expect(updated.harga_satuan).toBeCloseTo(7.55);
    expect(updated.kode_sku).toBe('sku-updated');

    // Verify database row matches
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, original.id)).execute();
    expect(rows).toHaveLength(1);
    const dbRow = rows[0] as any;
    expect(dbRow.nama).toBe('Updated Name');
    expect(dbRow.deskripsi).toBeNull();
    expect(dbRow.jumlah_stok).toBe(20);
    expect(parseFloat(dbRow.harga_satuan)).toBeCloseTo(7.55);
    expect(dbRow.kode_sku).toBe('sku-updated');
  });

  it('leaves unspecified fields unchanged', async () => {
    const original = await insertProduct();

    const updateInput: UpdateProductInput = {
      id: original.id,
      nama: 'Partial Update',
    };

    const updated = await updateProduct(updateInput);

    expect(updated.nama).toBe('Partial Update');
    // Unchanged fields should retain original values
    expect(updated.deskripsi).toBe(original.deskripsi);
    expect(updated.jumlah_stok).toBe(original.jumlah_stok);
    expect(updated.harga_satuan).toBeCloseTo(original.harga_satuan);
    expect(updated.kode_sku).toBe(original.kode_sku);

    // Verify DB state
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, original.id)).execute();
    const dbRow = rows[0] as any;
    expect(dbRow.nama).toBe('Partial Update');
    expect(dbRow.deskripsi).toBe(original.deskripsi);
    expect(dbRow.jumlah_stok).toBe(original.jumlah_stok);
    expect(parseFloat(dbRow.harga_satuan)).toBeCloseTo(original.harga_satuan);
    expect(dbRow.kode_sku).toBe(original.kode_sku);
  });
});
