import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput, type UpdateServiceInput } from '../schema';
import { updateService } from '../handlers/update_service';
import { eq } from 'drizzle-orm';

// Helper to create a test service
const createTestService = async (serviceData: Partial<CreateServiceInput> = {}) => {
  const defaultService = {
    title: 'Test Service',
    description: 'A service for testing',
    icon: 'test-icon',
    price_range: '$100-$200',
    is_featured: false,
    display_order: 1
  };
  
  const serviceInput = { ...defaultService, ...serviceData };
  
  const result = await db.insert(servicesTable)
    .values(serviceInput)
    .returning()
    .execute();
    
  return result[0];
};

describe('updateService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a service', async () => {
    // Create initial service
    const initialService = await createTestService();
    
    const updateInput: UpdateServiceInput = {
      id: initialService.id,
      title: 'Updated Service Title',
      description: 'Updated description',
      icon: 'updated-icon',
      price_range: '$200-$400',
      is_featured: true,
      display_order: 5
    };

    const result = await updateService(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(initialService.id);
    expect(result.title).toEqual('Updated Service Title');
    expect(result.description).toEqual('Updated description');
    expect(result.icon).toEqual('updated-icon');
    expect(result.price_range).toEqual('$200-$400');
    expect(result.is_featured).toBe(true);
    expect(result.display_order).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial service
    const initialService = await createTestService({
      title: 'Original Title',
      description: 'Original description',
      is_featured: false,
      display_order: 1
    });
    
    const updateInput: UpdateServiceInput = {
      id: initialService.id,
      title: 'New Title Only',
      is_featured: true
    };

    const result = await updateService(updateInput);

    // Verify only specified fields were updated
    expect(result.title).toEqual('New Title Only');
    expect(result.is_featured).toBe(true);
    // These should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.display_order).toEqual(1);
    expect(result.icon).toEqual('test-icon');
    expect(result.price_range).toEqual('$100-$200');
  });

  it('should handle nullable price_range field', async () => {
    // Create service with price range
    const initialService = await createTestService({
      price_range: '$100-$200'
    });
    
    const updateInput: UpdateServiceInput = {
      id: initialService.id,
      price_range: null
    };

    const result = await updateService(updateInput);

    expect(result.price_range).toBeNull();
  });

  it('should update service in database', async () => {
    // Create initial service
    const initialService = await createTestService();
    
    const updateInput: UpdateServiceInput = {
      id: initialService.id,
      title: 'Database Updated Title',
      display_order: 10
    };

    await updateService(updateInput);

    // Verify changes were persisted to database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, initialService.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].title).toEqual('Database Updated Title');
    expect(services[0].display_order).toEqual(10);
    // Unchanged fields should remain the same
    expect(services[0].description).toEqual('A service for testing');
    expect(services[0].icon).toEqual('test-icon');
  });

  it('should throw error when service does not exist', async () => {
    const updateInput: UpdateServiceInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateService(updateInput))
      .rejects.toThrow(/Service with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create initial service
    const initialService = await createTestService({
      title: 'Original Title',
      description: 'Original description'
    });
    
    // Update with only ID (no fields to update)
    const updateInput: UpdateServiceInput = {
      id: initialService.id
    };

    const result = await updateService(updateInput);

    // Should return unchanged service
    expect(result.title).toEqual('Original Title');
    expect(result.description).toEqual('Original description');
    expect(result.id).toEqual(initialService.id);
  });

  it('should maintain created_at timestamp', async () => {
    // Create initial service
    const initialService = await createTestService();
    const originalCreatedAt = initialService.created_at;
    
    // Wait a small amount to ensure timestamp would differ if changed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateServiceInput = {
      id: initialService.id,
      title: 'Updated Title'
    };

    const result = await updateService(updateInput);

    // created_at should remain unchanged
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
