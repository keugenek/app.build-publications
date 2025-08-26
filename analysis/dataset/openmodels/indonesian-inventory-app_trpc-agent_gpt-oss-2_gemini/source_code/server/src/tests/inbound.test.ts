import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { itemsTable, inboundTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateInboundInput, type Inbound } from '../schema';
import { createInbound } from '../handlers/inbound';

// Helper to create an item for testing
const createTestItem = async () => {
  const item = await db
    .insert(itemsTable)
    .values({
      nama: 'Test Item',
      kode: 'TEST001',
      deskripsi: null,
      harga_beli: (10.5).toString(), // numeric stored as string
      harga_jual: (15.75).toString(),
      satuan: 'pcs',
    })
    .returning()
    .execute();
  return item[0];
};

describe('createInbound handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert inbound transaction and update item stock', async () => {
    const item = await createTestItem();

    const inboundInput: CreateInboundInput = {
      barang_id: item.id,
      tanggal_masuk: new Date('2023-01-01T00:00:00Z'),
      jumlah: 20,
      supplier: null,
    };

    const result: Inbound = await createInbound(inboundInput);

    // Verify returned inbound fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.barang_id).toBe(item.id);
    expect(result.tanggal_masuk).toEqual(inboundInput.tanggal_masuk);
    expect(result.jumlah).toBe(20);
    expect(result.supplier).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify stock updated
    const updatedItem = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    expect(updatedItem).toHaveLength(1);
    expect(updatedItem[0].stok_saat_ini).toBe(20);
  });

  it('should handle non‑null supplier values', async () => {
    const item = await createTestItem();

    const inboundInput: CreateInboundInput = {
      barang_id: item.id,
      tanggal_masuk: new Date('2023-02-15T12:30:00Z'),
      jumlah: 5,
      supplier: 'Supplier A',
    };

    const result = await createInbound(inboundInput);
    expect(result.supplier).toBe('Supplier A');

    // Stock should reflect the quantity added
    const updated = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    expect(updated[0].stok_saat_ini).toBe(5);
  });
});
