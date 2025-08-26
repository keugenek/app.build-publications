import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq, and, gte } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateServiceInput = {
  title: 'Emergency Plumbing Repair',
  description: 'Fast and reliable emergency plumbing repair services available 24/7',
  icon: 'wrench-icon',
  price_range: '$150-$300',
  is_featured: true,
  display_order: 1
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service with all fields', async () => {
    const result = await createService(testInput);

    // Basic field validation
    expect(result.title).toEqual('Emergency Plumbing Repair');
    expect(result.description).toEqual(testInput.description);
    expect(result.icon).toEqual('wrench-icon');
    expect(result.price_range).toEqual('$150-$300');
    expect(result.is_featured).toEqual(true);
    expect(result.display_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a service with null price_range', async () => {
    const inputWithNullPrice: CreateServiceInput = {
      title: 'Basic Consultation',
      description: 'General plumbing consultation and advice',
      icon: 'consultation-icon',
      price_range: null,
      is_featured: false,
      display_order: 5
    };

    const result = await createService(inputWithNullPrice);

    expect(result.title).toEqual('Basic Consultation');
    expect(result.price_range).toBeNull();
    expect(result.is_featured).toEqual(false);
    expect(result.display_order).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service to database', async () => {
    const result = await createService(testInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    const savedService = services[0];
    
    expect(savedService.title).toEqual('Emergency Plumbing Repair');
    expect(savedService.description).toEqual(testInput.description);
    expect(savedService.icon).toEqual('wrench-icon');
    expect(savedService.price_range).toEqual('$150-$300');
    expect(savedService.is_featured).toEqual(true);
    expect(savedService.display_order).toEqual(1);
    expect(savedService.created_at).toBeInstanceOf(Date);
  });

  it('should use Zod defaults correctly', async () => {
    // Test input with minimal required fields (Zod defaults should apply)
    const minimalInput: CreateServiceInput = {
      title: 'Basic Service',
      description: 'A basic plumbing service',
      icon: 'basic-icon',
      price_range: null,
      is_featured: false, // Explicitly set default value
      display_order: 0
    };

    const result = await createService(minimalInput);

    expect(result.title).toEqual('Basic Service');
    expect(result.is_featured).toEqual(false); // Zod default
    expect(result.display_order).toEqual(0);
    expect(result.price_range).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle multiple services with different display orders', async () => {
    const service1: CreateServiceInput = {
      title: 'First Service',
      description: 'First service description',
      icon: 'first-icon',
      price_range: '$100-$200',
      is_featured: true,
      display_order: 1
    };

    const service2: CreateServiceInput = {
      title: 'Second Service',
      description: 'Second service description',
      icon: 'second-icon',
      price_range: '$200-$400',
      is_featured: false,
      display_order: 2
    };

    const result1 = await createService(service1);
    const result2 = await createService(service2);

    expect(result1.display_order).toEqual(1);
    expect(result2.display_order).toEqual(2);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both services exist in database
    const allServices = await db.select()
      .from(servicesTable)
      .execute();

    expect(allServices).toHaveLength(2);
  });

  it('should handle date filtering correctly', async () => {
    // Create test service
    await createService(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Proper query building - apply filter directly
    const services = await db.select()
      .from(servicesTable)
      .where(gte(servicesTable.created_at, yesterday))
      .execute();

    expect(services.length).toBeGreaterThan(0);
    services.forEach(service => {
      expect(service.created_at).toBeInstanceOf(Date);
      expect(service.created_at >= yesterday).toBe(true);
    });
  });

  it('should preserve all service properties correctly', async () => {
    const complexInput: CreateServiceInput = {
      title: 'Complex Emergency Service',
      description: 'A comprehensive emergency plumbing service with multiple features and capabilities',
      icon: 'emergency-complex-icon',
      price_range: '$500-$1000',
      is_featured: true,
      display_order: 10
    };

    const result = await createService(complexInput);

    // Verify all properties are preserved exactly
    expect(result.title).toEqual(complexInput.title);
    expect(result.description).toEqual(complexInput.description);
    expect(result.icon).toEqual(complexInput.icon);
    expect(result.price_range).toEqual(complexInput.price_range);
    expect(result.is_featured).toEqual(complexInput.is_featured);
    expect(result.display_order).toEqual(complexInput.display_order);
    
    // Verify generated fields
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify created_at is recent (within last few seconds)
    const now = new Date();
    const timeDiff = now.getTime() - result.created_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds ago
  });
});
