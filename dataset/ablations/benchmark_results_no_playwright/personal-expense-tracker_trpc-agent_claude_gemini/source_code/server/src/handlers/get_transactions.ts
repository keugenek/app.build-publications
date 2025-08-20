import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction, type TransactionFilters } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const getTransactions = async (filters?: TransactionFilters): Promise<Transaction[]> => {
  try {
    // Build where conditions
    const whereConditions = [];
    
    if (filters?.type) {
      whereConditions.push(eq(transactionsTable.type, filters.type));
    }
    
    if (filters?.category_id !== undefined) {
      whereConditions.push(eq(transactionsTable.category_id, filters.category_id));
    }
    
    if (filters?.start_date) {
      whereConditions.push(gte(transactionsTable.date, filters.start_date));
    }
    
    if (filters?.end_date) {
      whereConditions.push(lte(transactionsTable.date, filters.end_date));
    }

    // Build query based on whether we have conditions
    let query;
    
    if (whereConditions.length === 0) {
      // No filters - simple query
      query = db.select()
        .from(transactionsTable)
        .orderBy(desc(transactionsTable.date));
    } else {
      // With filters
      query = db.select()
        .from(transactionsTable)
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .orderBy(desc(transactionsTable.date));
    }
    
    // Apply pagination if needed
    if (filters?.limit && filters?.offset) {
      query = query.limit(filters.limit).offset(filters.offset);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    } else if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query.execute();

    // Convert numeric fields to numbers before returning
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Get transactions failed:', error);
    throw error;
  }
};
