import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plumbingServicesTable } from '../db/schema';
import { getPlumbingServices } from '../handlers/get_plumbing_services';

describe('getPlumbingServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getPlumbingServices();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all plumbing services ordered by display_order', async () => {
    // Insert test services in random order
    await db.insert(plumbingServicesTable).values([
      {
        title: 'Emergency Repairs',
        description: '24/7 emergency plumbing repairs',
        icon: 'emergency-icon.svg',
        display_order: 3
      },
      {
        title: 'Drain Cleaning',
        description: 'Professional drain cleaning services',
        icon: 'drain-icon.svg',
        display_order: 1
      },
      {
        title: 'Pipe Installation',
        description: 'New pipe installation and replacement',
        icon: null,
        display_order: 2
      }
    ]).execute();

    const result = await getPlumbingServices();

    // Should return 3 services
    expect(result).toHaveLength(3);
    
    // Should be ordered by display_order (ascending)
    expect(result[0].title).toEqual('Drain Cleaning');
    expect(result[0].display_order).toEqual(1);
    expect(result[1].title).toEqual('Pipe Installation');
    expect(result[1].display_order).toEqual(2);
    expect(result[2].title).toEqual('Emergency Repairs');
    expect(result[2].display_order).toEqual(3);
  });

  it('should handle services with same display_order', async () => {
    // Insert services with same display_order
    await db.insert(plumbingServicesTable).values([
      {
        title: 'Service A',
        description: 'Description A',
        icon: 'icon-a.svg',
        display_order: 1
      },
      {
        title: 'Service B',
        description: 'Description B',
        icon: 'icon-b.svg',
        display_order: 1
      }
    ]).execute();

    const result = await getPlumbingServices();

    expect(result).toHaveLength(2);
    expect(result[0].display_order).toEqual(1);
    expect(result[1].display_order).toEqual(1);
  });

  it('should return all service fields correctly', async () => {
    await db.insert(plumbingServicesTable).values({
      title: 'Water Heater Repair',
      description: 'Expert water heater repair and maintenance',
      icon: 'water-heater-icon.svg',
      display_order: 1
    }).execute();

    const result = await getPlumbingServices();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Water Heater Repair',
      description: 'Expert water heater repair and maintenance',
      icon: 'water-heater-icon.svg',
      display_order: 1
    });
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('number');
  });

  it('should handle services with null icon field', async () => {
    await db.insert(plumbingServicesTable).values({
      title: 'Basic Service',
      description: 'A basic plumbing service',
      icon: null,
      display_order: 1
    }).execute();

    const result = await getPlumbingServices();

    expect(result).toHaveLength(1);
    expect(result[0].icon).toBeNull();
    expect(result[0].title).toEqual('Basic Service');
  });

  it('should maintain order consistency across multiple calls', async () => {
    // Insert multiple services
    await db.insert(plumbingServicesTable).values([
      { title: 'Service 1', description: 'Desc 1', icon: null, display_order: 5 },
      { title: 'Service 2', description: 'Desc 2', icon: null, display_order: 2 },
      { title: 'Service 3', description: 'Desc 3', icon: null, display_order: 8 },
      { title: 'Service 4', description: 'Desc 4', icon: null, display_order: 1 }
    ]).execute();

    const result1 = await getPlumbingServices();
    const result2 = await getPlumbingServices();

    // Both calls should return same order
    expect(result1).toEqual(result2);
    expect(result1.map(s => s.display_order)).toEqual([1, 2, 5, 8]);
    expect(result1.map(s => s.title)).toEqual(['Service 4', 'Service 2', 'Service 1', 'Service 3']);
  });
});
