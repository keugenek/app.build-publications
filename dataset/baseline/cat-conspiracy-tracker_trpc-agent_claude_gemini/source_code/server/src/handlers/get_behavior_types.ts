import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { type BehaviorType } from '../schema';
import { asc } from 'drizzle-orm';

export const getBehaviorTypes = async (): Promise<BehaviorType[]> => {
  try {
    const results = await db.select()
      .from(behaviorTypesTable)
      .orderBy(asc(behaviorTypesTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch behavior types:', error);
    throw error;
  }
};
