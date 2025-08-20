import { db } from "../db";
import { progresses } from "../db/schema";
import { type Progress } from "../schema";

export const getProgresses = async (): Promise<Progress[]> => {
  try {
    const rows = await db.select().from(progresses).execute();
    // Convert numeric fields back to numbers for numeric column easiness_factor
    return rows.map(row => ({
      ...row,
      easiness_factor: parseFloat(row.easiness_factor as unknown as string)
    }));
  } catch (error) {
    console.error('Failed to fetch progresses:', error);
    throw error;
  }
};
