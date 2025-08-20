import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { getServices } from '../handlers/get_services';

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all services from database', async () => {
    // Insert test services directly to database
    await db.insert(servicesTable)
      .values([
        {
          name: 'Drain Cleaning',
          description: 'Professional drain cleaning service for all types of clogs'
        },
        {
          name: 'Pipe Repair',
          description: 'Expert pipe repair and replacement services'
        }
      ])
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(2);
    
    // Check first service
    expect(result[0].name).toEqual('Drain Cleaning');
    expect(result[0].description).toEqual('Professional drain cleaning service for all types of clogs');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second service
    expect(result[1].name).toEqual('Pipe Repair');
    expect(result[1].description).toEqual('Expert pipe repair and replacement services');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return services in database insertion order', async () => {
    // Insert services in specific order
    await db.insert(servicesTable)
      .values({
        name: 'Emergency Repairs',
        description: '24/7 emergency plumbing repairs'
      })
      .execute();

    await db.insert(servicesTable)
      .values({
        name: 'Water Heater Installation',
        description: 'Professional water heater installation and maintenance'
      })
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Emergency Repairs');
    expect(result[1].name).toEqual('Water Heater Installation');
  });

  it('should handle single service correctly', async () => {
    // Insert single service
    await db.insert(servicesTable)
      .values({
        name: 'Bathroom Renovation',
        description: 'Complete bathroom plumbing renovation services'
      })
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Bathroom Renovation');
    expect(result[0].description).toEqual('Complete bathroom plumbing renovation services');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should preserve all service fields correctly', async () => {
    // Insert service with known timestamp for verification
    const insertResult = await db.insert(servicesTable)
      .values({
        name: 'Leak Detection',
        description: 'Advanced leak detection using modern equipment'
      })
      .returning()
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    const service = result[0];
    const insertedService = insertResult[0];

    // Verify all fields match what was inserted
    expect(service.id).toEqual(insertedService.id);
    expect(service.name).toEqual(insertedService.name);
    expect(service.description).toEqual(insertedService.description);
    expect(service.created_at).toEqual(insertedService.created_at);
  });
});
