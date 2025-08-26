import { db } from '../db';
import { itemsTable, inboundTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { type Inbound, type CreateInboundInput } from '../schema';

/**
 * Creates an inbound transaction and updates the item's stock quantity.
 *
 * Steps:
 * 1. Insert a new row into `inbound_transactions`.
 * 2. Increment the related item's `stok_saat_ini` by the inbound `jumlah`.
 * 3. Return the inserted inbound record.
 */
export const createInbound = async (input: CreateInboundInput): Promise<Inbound> => {
  try {
    // Insert inbound transaction
    const inserted = await db
      .insert(inboundTable)
      .values({
        barang_id: input.barang_id,
        tanggal_masuk: input.tanggal_masuk,
        jumlah: input.jumlah,
        supplier: input.supplier ?? null,
      })
      .returning()
      .execute();

    const inboundRecord = inserted[0];

    // Update stock for the related item – increase by the inbound quantity
    await db
      .update(itemsTable)
      .set({
        stok_saat_ini: sql`${itemsTable.stok_saat_ini} + ${input.jumlah}`,
      })
      .where(eq(itemsTable.id, input.barang_id))
      .execute();

    // Return the freshly inserted inbound transaction, ensuring nullable fields are explicit
    return {
      ...inboundRecord,
      supplier: inboundRecord.supplier ?? null,
    } as Inbound;
  } catch (error) {
    console.error('Failed to create inbound transaction:', error);
    throw error;
  }
};
