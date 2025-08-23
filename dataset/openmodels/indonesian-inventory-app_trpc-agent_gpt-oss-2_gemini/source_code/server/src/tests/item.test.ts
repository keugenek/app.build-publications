import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type CreateItemInput, type UpdateItemInput } from '../schema';
import { createItem, getItems, updateItem, deleteItem } from '../handlers/item';
import { eq } from 'drizzle-orm';

const testInput: CreateItemInput = {
  nama: 'Test Barang',
  kode: 'KB001',
  deskripsi: 'Deskripsi test',
  harga_beli: 1000.5,
  harga_jual: 1500.75,
  satuan: 'pcs',
};

describe('Item Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an item with correct fields', async () => {
    const result = await createItem(testInput);

    expect(result.id).toBeDefined();
    expect(result.nama).toBe(testInput.nama);
    expect(result.kode).toBe(testInput.kode);
    expect(result.deskripsi).toBe(testInput.deskripsi);
    expect(result.harga_beli).toBeCloseTo(testInput.harga_beli);
    expect(result.harga_jual).toBeCloseTo(testInput.harga_jual);
    expect(result.satuan).toBe(testInput.satuan);
    expect(result.stok_saat_ini).toBe(0);
    expect(result.created_at).toBeInstanceOf(Date);
    // Verify numeric storage as string in DB
    const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    expect(parseFloat(rows[0].harga_beli as unknown as string)).toBeCloseTo(testInput.harga_beli);
    expect(parseFloat(rows[0].harga_jual as unknown as string)).toBeCloseTo(testInput.harga_jual);
  });

  it('should fetch items including the newly created one', async () => {
    const created = await createItem(testInput);
    const items = await getItems();
    const found = items.find((i) => i.id === created.id);
    expect(found).toBeDefined();
    expect(found?.nama).toBe(testInput.nama);
    expect(found?.harga_beli).toBeCloseTo(testInput.harga_beli);
    expect(found?.harga_jual).toBeCloseTo(testInput.harga_jual);
  });

  it('should update an existing item', async () => {
    const created = await createItem(testInput);
    const updateInput: UpdateItemInput = {
      id: created.id,
      nama: 'Updated Nama',
      harga_beli: 2000.0,
    };
    const updated = await updateItem(updateInput);
    expect(updated.id).toBe(created.id);
    expect(updated.nama).toBe('Updated Nama');
    expect(updated.harga_beli).toBeCloseTo(2000.0);
    // unchanged fields remain the same
    expect(updated.kode).toBe(created.kode);
    expect(updated.harga_jual).toBeCloseTo(created.harga_jual);
  });

  it('should delete an item', async () => {
    const created = await createItem(testInput);
    const delResult = await deleteItem(created.id);
    expect(delResult.success).toBe(true);
    const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, created.id)).execute();
    expect(rows).toHaveLength(0);
  });
});
