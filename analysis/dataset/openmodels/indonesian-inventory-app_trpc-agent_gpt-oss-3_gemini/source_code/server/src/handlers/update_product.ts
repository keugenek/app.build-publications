import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateProductInput, type Product } from '../schema';

/**
 * Updates a product record in the database.
 * Numeric fields are stored as `numeric` in the DB, so they are converted to strings on insert/update
 * and parsed back to numbers on read.
 */
export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  // Build an update object with only the provided fields
  const updates: any = {};

  if (input.nama !== undefined) updates.nama = input.nama;
  if (input.deskripsi !== undefined) updates.deskripsi = input.deskripsi;
  if (input.jumlah_stok !== undefined) updates.jumlah_stok = input.jumlah_stok;
  if (input.harga_satuan !== undefined) updates.harga_satuan = input.harga_satuan.toString(); // numeric column expects string
  if (input.kode_sku !== undefined) updates.kode_sku = input.kode_sku;

  // Perform the update and return the updated row
  const result = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, input.id))
    .returning()
    .execute();

  const product = result[0];

  // Convert numeric fields back to numbers before returning
  return {
    ...product,
    harga_satuan: parseFloat(product.harga_satuan as unknown as string),
  } as Product;
};
