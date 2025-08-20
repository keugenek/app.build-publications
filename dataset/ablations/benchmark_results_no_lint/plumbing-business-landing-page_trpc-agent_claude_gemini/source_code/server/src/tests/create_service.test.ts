import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateServiceInput = {
  name: 'Drain Cleaning',
  description: 'Professional drain cleaning and unclogging service for residential and commercial properties'
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service', async () => {
    const result = await createService(testInput);

    // Basic field validation
    expect(result.name).toEqual('Drain Cleaning');
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
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
    expect(services[0].name).toEqual('Drain Cleaning');
    expect(services[0].description).toEqual(testInput.description);
    expect(services[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple services with unique IDs', async () => {
    const input1 = {
      name: 'Pipe Repair',
      description: 'Emergency pipe repair and replacement services'
    };

    const input2 = {
      name: 'Water Heater Installation',
      description: 'Professional water heater installation and maintenance'
    };

    const service1 = await createService(input1);
    const service2 = await createService(input2);

    // Verify unique IDs
    expect(service1.id).not.toEqual(service2.id);
    expect(service1.name).toEqual('Pipe Repair');
    expect(service2.name).toEqual('Water Heater Installation');

    // Verify both services exist in database
    const allServices = await db.select()
      .from(servicesTable)
      .execute();

    expect(allServices).toHaveLength(2);
    
    const serviceNames = allServices.map(s => s.name);
    expect(serviceNames).toContain('Pipe Repair');
    expect(serviceNames).toContain('Water Heater Installation');
  });

  it('should handle empty description', async () => {
    const inputWithEmptyDesc = {
      name: 'Basic Service',
      description: ''
    };

    // This should fail validation at the schema level if called through API,
    // but handler itself accepts any string
    const result = await createService(inputWithEmptyDesc);
    
    expect(result.name).toEqual('Basic Service');
    expect(result.description).toEqual('');
    expect(result.id).toBeDefined();
  });

  it('should preserve service name and description exactly as provided', async () => {
    const specialInput = {
      name: '24/7 Emergency Plumbing & Repair Services',
      description: 'Comprehensive plumbing services including: leak detection, pipe repair, drain cleaning, water heater installation, and emergency repairs available 24/7.'
    };

    const result = await createService(specialInput);

    expect(result.name).toEqual(specialInput.name);
    expect(result.description).toEqual(specialInput.description);

    // Verify exact match in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services[0].name).toEqual(specialInput.name);
    expect(services[0].description).toEqual(specialInput.description);
  });
});
