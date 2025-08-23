import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { itemsTable, outboundTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateOutboundInput } from '../schema';
import { createOutbound } from '../handlers/outbound';

// Helper to create an item directly in DB
const createTestItem = async () => {
  const result = await db
    .insert(itemsTable)
    .values({
      nama: 'Test Barang',
      kode: 'TEST001',
      deskripsi: 'Deskripsi test',
      harga_beli: '1000', // numeric column, Drizzle will handle conversion to string
      harga_jual: '1500',
      stok_saat_ini: 50,
      satuan: 'pcs',
    })
    .returning()
    .execute();
  return result[0];
};

describe('createOutbound handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an outbound transaction and decrement item stock', async () => {
    // Arrange: create an item with known stock
    const item = await createTestItem();
    const input: CreateOutboundInput = {
      barang_id: item.id,
      tanggal_keluar: new Date(),
      jumlah: 10,
      penerima: 'Customer A',
    };

    // Act: create outbound transaction
    const outbound = await createOutbound(input);

    // Assert: outbound fields
    expect(outbound.id).toBeDefined();
    expect(outbound.barang_id).toBe(item.id);
    expect(outbound.jumlah).toBe(10);
    expect(outbound.penerima).toBe('Customer A');
    expect(outbound.tanggal_keluar).toBeInstanceOf(Date);
    expect(outbound.created_at).toBeInstanceOf(Date);

    // Verify DB record exists
    const savedOutbound = await db
      .select()
      .from(outboundTable)
      .where(eq(outboundTable.id, outbound.id))
      .execute();
    expect(savedOutbound).toHaveLength(1);
    expect(savedOutbound[0].jumlah).toBe(10);

    // Verify stock decrement
    const updatedItem = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    expect(updatedItem).toHaveLength(1);
    expect(updatedItem[0].stok_saat_ini).toBe(item.stok_saat_ini - 10);
  });

  it('should handle null penerima', async () => {
    const item = await createTestItem();
    const input: CreateOutboundInput = {
      barang_id: item.id,
      tanggal_keluar: new Date(),
      jumlah: 5,
      penerima: null,
    };
    const outbound = await createOutbound(input);
    expect(outbound.penerima).toBeNull();
  });
});
