import { type CreateTransactionInput, type Transaction } from '../schema';

/**
 * Stub implementation for creating a transaction.
 * In a real implementation this would insert the transaction and adjust product stock.
 */
export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    tanggal: input.tanggal,
    jenis: input.jenis,
    produk_id: input.produk_id,
    jumlah: input.jumlah,
    pihak_terlibat: input.pihak_terlibat ?? null,
    nomor_referensi: input.nomor_referensi ?? null,
    created_at: new Date(),
  } as Transaction;
};
