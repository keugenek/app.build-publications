import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

/**
 * Creates a new product record in the database and returns the created product.
 * Numeric fields are stored as strings in the DB (numeric column) and converted
 * back to numbers when returning.
 */
export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    const result = await db
      .insert(productsTable)
      .values({
        nama: input.nama,
        deskripsi: input.deskripsi ?? null,
        jumlah_stok: input.jumlah_stok ?? 0,
        harga_satuan: input.harga_satuan.toString(), // numeric stored as string
        kode_sku: input.kode_sku,
      })
      .returning()
      .execute();

    const row = result[0];
    return {
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi ?? null,
      jumlah_stok: row.jumlah_stok,
      harga_satuan: parseFloat(row.harga_satuan as any),
      kode_sku: row.kode_sku,
      created_at: row.created_at,
    } as Product;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};
