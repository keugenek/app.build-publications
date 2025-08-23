import { type CreateServiceInput, type Service } from '../schema';
import { db } from '../db';
import { servicesTable } from '../db/schema';

export const createService = async (input: CreateServiceInput): Promise<Service> => {
  // Insert new service into the database
  const [newService] = await db.insert(servicesTable).values(input).returning();
  return newService;
};