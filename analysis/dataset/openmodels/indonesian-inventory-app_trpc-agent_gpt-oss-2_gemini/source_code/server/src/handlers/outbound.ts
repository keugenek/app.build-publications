import { type Outbound, type CreateOutboundInput } from '../schema';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { itemsTable, outboundTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler to create an outbound transaction (barang keluar).
 * Inserts a new record into the outbound_transactions table and decrements the related item's stok_saat_ini.
 */
export const createOutbound = async (input: CreateOutboundInput): Promise<Outbound> => {
  try {
    // Insert outbound transaction record
    const outboundResult = await db
      .insert(outboundTable)
      .values({
        barang_id: input.barang_id,
        tanggal_keluar: input.tanggal_keluar,
        jumlah: input.jumlah,
        penerima: input.penerima ?? null,
      })
      .returning()
      .execute();

    const outbound = outboundResult[0];

    // Decrement stock for the related item using raw SQL expression
    await db
      .update(itemsTable)
      .set({
        stok_saat_ini: sql`${itemsTable.stok_saat_ini} - ${input.jumlah}`,
      })
      .where(eq(itemsTable.id, input.barang_id))
      .execute();

    return outbound as Outbound;
  } catch (error) {
    console.error('Failed to create outbound transaction:', error);
    throw error;
  }
};
