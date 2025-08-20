import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { getServices } from '../handlers/get_services';
import { type Service } from '../schema';

/**
 * Helper to insert a service directly via DB for test setup.
 */
const insertService = async (service: Omit<Service, 'id'>) => {
  const result = await db
    .insert(servicesTable)
    .values({
      name: service.name,
      description: service.description,
      // numeric column expects string; handle null explicitly
      price: service.price !== null && service.price !== undefined ? service.price.toString() : null,
    })
    .returning()
    .execute();
  return result[0];
};

describe('getServices handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all services with correct numeric conversion', async () => {
    // Insert two services: one with price, one without
    const serviceA = await insertService({
      name: 'Pipe Fixing',
      description: 'Fix leaky pipes',
      price: 49.99,
    });
    const serviceB = await insertService({
      name: 'Drain Cleaning',
      description: 'Clear blocked drains',
      price: null,
    });

    const services = await getServices();

    // Expect both services to be returned
    expect(services).toHaveLength(2);

    // Find each by name for assertions
    const fetchedA = services.find(s => s.name === 'Pipe Fixing') as Service;
    const fetchedB = services.find(s => s.name === 'Drain Cleaning') as Service;

    expect(fetchedA).toBeDefined();
    expect(fetchedA.price).toBe(49.99);
    expect(typeof fetchedA.price).toBe('number');

    expect(fetchedB).toBeDefined();
    expect(fetchedB.price).toBeNull();
  });
});
