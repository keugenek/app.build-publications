import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';
import { getServices } from '../handlers/get_services';
import { eq } from 'drizzle-orm';

const testService: Omit<Service, 'id' | 'created_at'> = {
  title: 'Plumbing Repair',
  description: 'Fix leaky faucets and pipes',
  price: 149.99,
};

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no services exist', async () => {
    const services = await getServices();
    expect(services).toBeInstanceOf(Array);
    expect(services).toHaveLength(0);
  });

  it('should fetch all services with numeric conversion', async () => {
    // Insert a service directly via drizzle
    const inserted = await db
      .insert(servicesTable)
      .values({
        title: testService.title,
        description: testService.description,
        price: testService.price.toString(), // numeric column stores as string
      })
      .returning()
      .execute();

    const insertedRow = inserted[0];
    // Ensure the row is inserted correctly
    expect(insertedRow.title).toBe(testService.title);

    const services = await getServices();
    expect(services).toHaveLength(1);
    const fetched = services[0];
    // Verify fields
    expect(fetched.title).toBe(testService.title);
    expect(fetched.description).toBe(testService.description);
    expect(fetched.price).toBeCloseTo(testService.price);
    expect(fetched.id).toBeDefined();
    expect(fetched.created_at).toBeInstanceOf(Date);
  });
});
