import { db } from '../db';
import { itemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Item, CreateItemInput, UpdateItemInput } from '../schema';
import type { NewItem } from '../db/schema';

/**
 * Fetch all items (barang) from the database.
 * Numeric columns (harga_beli, harga_jual) are stored as strings by Drizzle, so they are converted back to numbers.
 */
export const getItems = async (): Promise<Item[]> => {
  try {
    const rows = await db.select().from(itemsTable).execute();
    // Convert numeric fields back to numbers
    return rows.map((row) => ({
      ...row,
      harga_beli: parseFloat(row.harga_beli as unknown as string),
      harga_jual: parseFloat(row.harga_jual as unknown as string),
    }));
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
};

/**
 * Create a new item in the database.
 * Numeric values are converted to strings before insertion because the underlying column type is numeric.
 */
export const createItem = async (input: CreateItemInput): Promise<Item> => {
  try {
    const insertValues: NewItem = {
      nama: input.nama,
      kode: input.kode,
      deskripsi: input.deskripsi ?? null,
      harga_beli: input.harga_beli.toString(),
      harga_jual: input.harga_jual.toString(),
      satuan: input.satuan,
      // stok_saat_ini uses default (0) and created_at uses defaultNow
    } as NewItem;

    const result = await db
      .insert(itemsTable)
      .values(insertValues)
      .returning()
      .execute();

    const row = result[0];
    return {
      ...row,
      harga_beli: parseFloat(row.harga_beli as unknown as string),
      harga_jual: parseFloat(row.harga_jual as unknown as string),
    };
  } catch (error) {
    console.error('Failed to create item:', error);
    throw error;
  }
};

/**
 * Update an existing item. Only fields present in the input are updated.
 */
export const updateItem = async (input: UpdateItemInput): Promise<Item> => {
  try {
    const updates: Partial<NewItem> = {};
    if (input.nama !== undefined) updates.nama = input.nama;
    if (input.kode !== undefined) updates.kode = input.kode;
    if (input.deskripsi !== undefined) updates.deskripsi = input.deskripsi;
    if (input.harga_beli !== undefined) updates.harga_beli = input.harga_beli.toString();
    if (input.harga_jual !== undefined) updates.harga_jual = input.harga_jual.toString();
    if (input.satuan !== undefined) updates.satuan = input.satuan;

    const result = await db
      .update(itemsTable)
      .set(updates)
      .where(eq(itemsTable.id, input.id))
      .returning()
      .execute();

    const row = result[0];
    return {
      ...row,
      harga_beli: parseFloat(row.harga_beli as unknown as string),
      harga_jual: parseFloat(row.harga_jual as unknown as string),
    };
  } catch (error) {
    console.error('Failed to update item:', error);
    throw error;
  }
};

/**
 * Delete an item by its ID.
 */
export const deleteItem = async (id: number): Promise<{ success: boolean }> => {
  try {
    await db.delete(itemsTable).where(eq(itemsTable.id, id)).execute();
    return { success: true };
  } catch (error) {
    console.error('Failed to delete item:', error);
    throw error;
  }
};
