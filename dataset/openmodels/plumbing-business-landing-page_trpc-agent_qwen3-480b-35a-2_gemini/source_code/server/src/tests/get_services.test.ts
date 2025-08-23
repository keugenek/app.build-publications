import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { getServices } from '../handlers/get_services';

// Test data
const testServices = [
  {
    name: "Emergency Plumbing",
    description: "24/7 emergency plumbing services for urgent repairs and installations.",
    icon: "emergency"
  },
  {
    name: "Drain Cleaning",
    description: "Professional drain cleaning services to keep your pipes flowing smoothly.",
    icon: "drain"
  },
  {
    name: "Water Heater Repair & Installation",
    description: "Expert installation and repair of water heaters for residential and commercial properties.",
    icon: "water-heater"
  }
];

describe('getServices', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test services
    for (const service of testServices) {
      await db.insert(servicesTable).values(service).execute();
    }
  });
  
  afterEach(resetDB);

  it('should fetch all services from the database', async () => {
    const services = await getServices();
    
    expect(services).toHaveLength(3);
    
    // Check that all services are returned with correct properties
    services.forEach((service, index) => {
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('name', testServices[index].name);
      expect(service).toHaveProperty('description', testServices[index].description);
      expect(service).toHaveProperty('icon', testServices[index].icon);
      expect(service).toHaveProperty('created_at');
      expect(service.created_at).toBeInstanceOf(Date);
      expect(typeof service.id).toBe('number');
    });
  });

  it('should return an empty array when no services exist', async () => {
    // Clear all services
    await db.delete(servicesTable).execute();
    
    const services = await getServices();
    
    expect(services).toHaveLength(0);
    expect(services).toEqual([]);
  });

  it('should maintain service order by id', async () => {
    const services = await getServices();
    
    // Check that services are ordered by id (ascending)
    for (let i = 0; i < services.length - 1; i++) {
      expect(services[i].id).toBeLessThan(services[i + 1].id);
    }
  });
});