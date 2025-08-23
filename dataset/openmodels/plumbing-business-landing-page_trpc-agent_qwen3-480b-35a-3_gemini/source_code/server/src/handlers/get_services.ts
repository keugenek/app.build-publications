import { type Service } from '../schema';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { asc } from 'drizzle-orm';

export const getServices = async (): Promise<Service[]> => {
  // Fetch all services from the database, ordered by creation date
  return await db.select().from(servicesTable).orderBy(asc(servicesTable.created_at));
};