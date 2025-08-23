import { db } from '../db/index';
import { plantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePlant = async (id: number): Promise<void> => {
  // The goal of this handler is deleting a plant from the database by its ID.
  await db.delete(plantsTable).where(eq(plantsTable.id, id));
  return;
};
