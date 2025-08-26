import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { getTransactions } from '../handlers/get_transactions';
import { eq } from 'drizzle-orm';

/**
 * Helper to create a product for FK constraints.
 */
const createTestProduct = async () => {
  const result = await db
    .insert(productsTable)
    .values({
      nama: 'Test Product',
      deskripsi: null,
      jumlah_stok: 0,
      harga_satuan: '10.00', // numeric stored as string
      kode_sku: 'TESTSKU123',
    })
    .returning()
    .execute();
  return result[0];
};

/**
 * Helper to create a transaction linked to a product.
 */
const createTestTransaction = async (productId: string) => {
  const now = new Date();
  const result = await db
    .insert(transactionsTable)
    .values({
      tanggal: now,
      jenis: 'masuk',
      produk_id: productId,
      jumlah: 5,
    })
    .returning()
    .execute();
  return result[0];
};

describe('getTransactions handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no transactions exist', async () => {
    const transactions = await getTransactions();
    expect(transactions).toBeArray();
    expect(transactions).toHaveLength(0);
  });

  it('should fetch transactions from the database', async () => {
    // Arrange: create required product and transaction
    const product = await createTestProduct();
    const inserted = await createTestTransaction(product.id);

    // Act: retrieve via handler
    const transactions = await getTransactions();

    // Assert: one transaction returned with correct data
    expect(transactions).toHaveLength(1);
    const tx = transactions[0] as Transaction;
    expect(tx.id).toBe(inserted.id);
    expect(tx.produk_id).toBe(product.id);
    expect(tx.jumlah).toBe(5);
    expect(tx.jenis).toBe('masuk');
    expect(tx.tanggal).toBeInstanceOf(Date);
    expect(tx.created_at).toBeInstanceOf(Date);
  });

  it('transactions stored in DB should match handler output', async () => {
    const product = await createTestProduct();
    await createTestTransaction(product.id);

    // Direct DB query for verification
    const dbTxs = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.produk_id, product.id))
      .execute();

    const handlerTxs = await getTransactions();

    // Compare after normalizing jenis to the enum type
    const normalizedDbTxs = dbTxs.map((t) => ({
      ...t,
      jenis: t.jenis as "masuk" | "keluar",
    }));
    expect(handlerTxs).toEqual(normalizedDbTxs);
  });
});
