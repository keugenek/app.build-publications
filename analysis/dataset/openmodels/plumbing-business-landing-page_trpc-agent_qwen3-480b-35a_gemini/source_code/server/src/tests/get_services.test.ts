import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { getServices } from '../handlers/get_services';

describe('getServices', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(servicesTable).values([
      {
        title: 'Web Development',
        description: 'Professional web development services',
        icon: 'code',
      },
      {
        title: 'UI/UX Design',
        description: 'User interface and experience design',
        icon: 'design',
      },
      {
        title: 'Consulting',
        description: 'Expert consulting services',
        icon: 'consult',
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all services from the database', async () => {
    const services = await getServices();

    expect(services).toHaveLength(3);
    
    // Check first service
    expect(services[0]).toEqual({
      id: expect.any(Number),
      title: 'Web Development',
      description: 'Professional web development services',
      icon: 'code',
      created_at: expect.any(Date)
    });

    // Check second service
    expect(services[1]).toEqual({
      id: expect.any(Number),
      title: 'UI/UX Design',
      description: 'User interface and experience design',
      icon: 'design',
      created_at: expect.any(Date)
    });

    // Check third service
    expect(services[2]).toEqual({
      id: expect.any(Number),
      title: 'Consulting',
      description: 'Expert consulting services',
      icon: 'consult',
      created_at: expect.any(Date)
    });
  });

  it('should return an empty array when no services exist', async () => {
    // Clear all services
    await db.delete(servicesTable).execute();
    
    const services = await getServices();
    
    expect(services).toHaveLength(0);
    expect(services).toEqual([]);
  });

  it('should maintain proper ordering by creation date', async () => {
    // Add another service
    await db.insert(servicesTable).values({
      title: 'Latest Service',
      description: 'Newest service offering',
      icon: 'new',
    }).execute();

    const services = await getServices();
    
    // Should have 4 services now
    expect(services).toHaveLength(4);
    
    // Check that the last service is the one we just added
    expect(services[3].title).toBe('Latest Service');
  });
});
