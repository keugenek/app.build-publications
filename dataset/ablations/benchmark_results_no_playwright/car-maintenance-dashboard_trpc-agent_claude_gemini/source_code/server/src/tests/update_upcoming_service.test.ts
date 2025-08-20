import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type UpdateUpcomingServiceInput } from '../schema';
import { updateUpcomingService } from '../handlers/update_upcoming_service';
import { eq } from 'drizzle-orm';

describe('updateUpcomingService', () => {
  let testCarId: number;
  let testUpcomingServiceId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test car first (required for foreign key)
    const carResult = await db
      .insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1234567890ABCDEFG',
        license_plate: 'ABC123',
        current_mileage: 25000
      })
      .returning()
      .execute();
    
    testCarId = carResult[0].id;

    // Create a test upcoming service
    const serviceResult = await db
      .insert(upcomingServicesTable)
      .values({
        car_id: testCarId,
        service_type: 'oil_change',
        description: 'Regular oil change service',
        due_date: new Date('2024-12-31'),
        due_mileage: 30000,
        is_completed: false,
        notes: 'Original notes'
      })
      .returning()
      .execute();

    testUpcomingServiceId = serviceResult[0].id;
  });

  afterEach(resetDB);

  it('should update an upcoming service with all fields', async () => {
    const updateInput: UpdateUpcomingServiceInput = {
      id: testUpcomingServiceId,
      service_type: 'brake_service',
      description: 'Updated brake service',
      due_date: new Date('2025-01-15'),
      due_mileage: 35000,
      is_completed: true,
      notes: 'Updated notes'
    };

    const result = await updateUpcomingService(updateInput);

    expect(result.id).toEqual(testUpcomingServiceId);
    expect(result.service_type).toEqual('brake_service');
    expect(result.description).toEqual('Updated brake service');
    expect(result.due_date).toEqual(new Date('2025-01-15'));
    expect(result.due_mileage).toEqual(35000);
    expect(result.is_completed).toEqual(true);
    expect(result.notes).toEqual('Updated notes');
    expect(result.car_id).toEqual(testCarId); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateUpcomingServiceInput = {
      id: testUpcomingServiceId,
      is_completed: true,
      notes: 'Service completed successfully'
    };

    const result = await updateUpcomingService(updateInput);

    expect(result.id).toEqual(testUpcomingServiceId);
    expect(result.is_completed).toEqual(true);
    expect(result.notes).toEqual('Service completed successfully');
    
    // These fields should remain unchanged
    expect(result.service_type).toEqual('oil_change');
    expect(result.description).toEqual('Regular oil change service');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.due_mileage).toEqual(30000);
    expect(result.car_id).toEqual(testCarId);
  });

  it('should update service in database', async () => {
    const updateInput: UpdateUpcomingServiceInput = {
      id: testUpcomingServiceId,
      service_type: 'inspection',
      is_completed: true
    };

    await updateUpcomingService(updateInput);

    // Verify changes were saved to database
    const services = await db
      .select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, testUpcomingServiceId))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].service_type).toEqual('inspection');
    expect(services[0].is_completed).toEqual(true);
    expect(services[0].description).toEqual('Regular oil change service'); // Should remain unchanged
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateUpcomingServiceInput = {
      id: testUpcomingServiceId,
      due_mileage: null,
      notes: null
    };

    const result = await updateUpcomingService(updateInput);

    expect(result.due_mileage).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should throw error when upcoming service not found', async () => {
    const updateInput: UpdateUpcomingServiceInput = {
      id: 99999, // Non-existent ID
      is_completed: true
    };

    await expect(updateUpcomingService(updateInput)).rejects.toThrow(/upcoming service not found/i);
  });

  it('should handle foreign key constraints when updating car_id', async () => {
    // Create another test car
    const anotherCarResult = await db
      .insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '9876543210ZYXWVU',
        license_plate: 'XYZ789',
        current_mileage: 15000
      })
      .returning()
      .execute();

    const anotherCarId = anotherCarResult[0].id;

    const updateInput: UpdateUpcomingServiceInput = {
      id: testUpcomingServiceId,
      car_id: anotherCarId
    };

    const result = await updateUpcomingService(updateInput);

    expect(result.car_id).toEqual(anotherCarId);
  });
});
