import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { getServices, getFeaturedServices } from '../handlers/get_services';

// Test data for services
const testServices: CreateServiceInput[] = [
  {
    title: 'Emergency Repair',
    description: 'Quick fixes for urgent plumbing issues',
    icon: 'emergency-icon',
    price_range: '$150-$250',
    is_featured: true,
    display_order: 1
  },
  {
    title: 'Regular Maintenance',
    description: 'Routine maintenance and inspections',
    icon: 'maintenance-icon',
    price_range: '$75-$125',
    is_featured: false,
    display_order: 3
  },
  {
    title: 'Installation Service',
    description: 'New fixture and appliance installations',
    icon: 'install-icon',
    price_range: '$200-$500',
    is_featured: true,
    display_order: 2
  },
  {
    title: 'Drain Cleaning',
    description: 'Professional drain cleaning services',
    icon: 'drain-icon',
    price_range: '$100-$200',
    is_featured: false,
    display_order: 4
  }
];

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    expect(result).toEqual([]);
  });

  it('should return all services ordered by display_order', async () => {
    // Insert test services
    await db.insert(servicesTable).values(testServices).execute();

    const result = await getServices();

    expect(result).toHaveLength(4);
    
    // Verify ordering by display_order
    expect(result[0].display_order).toBe(1);
    expect(result[1].display_order).toBe(2);
    expect(result[2].display_order).toBe(3);
    expect(result[3].display_order).toBe(4);

    // Verify all fields are present
    expect(result[0].title).toBe('Emergency Repair');
    expect(result[0].description).toBe('Quick fixes for urgent plumbing issues');
    expect(result[0].icon).toBe('emergency-icon');
    expect(result[0].price_range).toBe('$150-$250');
    expect(result[0].is_featured).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle services with same display_order by created_at', async () => {
    // Create services with same display_order but different creation times
    const service1 = {
      title: 'Service A',
      description: 'First service',
      icon: 'icon-a',
      price_range: null,
      is_featured: false,
      display_order: 5
    };

    const service2 = {
      title: 'Service B',
      description: 'Second service',
      icon: 'icon-b',
      price_range: null,
      is_featured: false,
      display_order: 5
    };

    // Insert first service
    await db.insert(servicesTable).values(service1).execute();
    
    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Insert second service
    await db.insert(servicesTable).values(service2).execute();

    const result = await getServices();

    expect(result).toHaveLength(2);
    // First inserted should come first when display_order is the same
    expect(result[0].title).toBe('Service A');
    expect(result[1].title).toBe('Service B');
  });

  it('should handle nullable fields correctly', async () => {
    const serviceWithNulls = {
      title: 'Basic Service',
      description: 'Simple service description',
      icon: 'basic-icon',
      price_range: null,
      is_featured: false,
      display_order: 1
    };

    await db.insert(servicesTable).values(serviceWithNulls).execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].price_range).toBeNull();
  });
});

describe('getFeaturedServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no featured services exist', async () => {
    // Insert non-featured services
    const nonFeaturedService = {
      title: 'Regular Service',
      description: 'Non-featured service',
      icon: 'regular-icon',
      price_range: '$100',
      is_featured: false,
      display_order: 1
    };

    await db.insert(servicesTable).values(nonFeaturedService).execute();

    const result = await getFeaturedServices();
    expect(result).toEqual([]);
  });

  it('should return only featured services ordered by display_order', async () => {
    // Insert test services
    await db.insert(servicesTable).values(testServices).execute();

    const result = await getFeaturedServices();

    expect(result).toHaveLength(2);
    
    // Should only return featured services
    expect(result.every(service => service.is_featured)).toBe(true);
    
    // Verify correct ordering by display_order
    expect(result[0].display_order).toBe(1); // Emergency Repair
    expect(result[1].display_order).toBe(2); // Installation Service
    
    expect(result[0].title).toBe('Emergency Repair');
    expect(result[1].title).toBe('Installation Service');
  });

  it('should return featured services with all required fields', async () => {
    const featuredService = {
      title: 'Premium Service',
      description: 'High-quality premium service',
      icon: 'premium-icon',
      price_range: '$300-$600',
      is_featured: true,
      display_order: 1
    };

    await db.insert(servicesTable).values(featuredService).execute();

    const result = await getFeaturedServices();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Premium Service');
    expect(result[0].description).toBe('High-quality premium service');
    expect(result[0].icon).toBe('premium-icon');
    expect(result[0].price_range).toBe('$300-$600');
    expect(result[0].is_featured).toBe(true);
    expect(result[0].display_order).toBe(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple featured services with proper ordering', async () => {
    const featuredServices = [
      {
        title: 'Featured Service C',
        description: 'Third featured service',
        icon: 'icon-c',
        price_range: '$200',
        is_featured: true,
        display_order: 10
      },
      {
        title: 'Featured Service A',
        description: 'First featured service',
        icon: 'icon-a',
        price_range: '$100',
        is_featured: true,
        display_order: 5
      },
      {
        title: 'Featured Service B',
        description: 'Second featured service',
        icon: 'icon-b',
        price_range: '$150',
        is_featured: true,
        display_order: 7
      }
    ];

    await db.insert(servicesTable).values(featuredServices).execute();

    const result = await getFeaturedServices();

    expect(result).toHaveLength(3);
    
    // Verify proper ordering by display_order
    expect(result[0].display_order).toBe(5);
    expect(result[1].display_order).toBe(7);
    expect(result[2].display_order).toBe(10);
    
    expect(result[0].title).toBe('Featured Service A');
    expect(result[1].title).toBe('Featured Service B');
    expect(result[2].title).toBe('Featured Service C');
  });
});
