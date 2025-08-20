import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type CreateCarInput, type CreateUpcomingServiceInput, type UpdateUpcomingServiceInput } from '../schema';
import { updateUpcomingService } from '../handlers/update_upcoming_service';
import { eq } from 'drizzle-orm';

// Test data
const testCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  vin: '1HGBH41JXMN109186'
};

describe('updateUpcomingService', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a car first since upcoming service references it
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();
    
    // Store the car ID for use in tests
    (testCarInput as any).id = carResult[0].id;
  });
  
  afterEach(resetDB);

  it('should update an upcoming service', async () => {
    // First create an upcoming service
    const createdService = await db.insert(upcomingServicesTable)
      .values({
        car_id: (testCarInput as any).id,
        service_type: 'Oil Change',
        due_date: '2023-12-31',
        due_mileage: 30000,
        notes: 'Synthetic oil recommended'
      })
      .returning()
      .execute();
    
    const serviceId = createdService[0].id;
    
    // Update the service
    const updateInput: UpdateUpcomingServiceInput = {
      id: serviceId,
      service_type: 'Tire Rotation',
      due_mileage: 35000,
      notes: 'Check tire pressure'
    };
    
    const result = await updateUpcomingService(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(serviceId);
    expect(result!.service_type).toEqual('Tire Rotation');
    expect(result!.due_mileage).toEqual(35000);
    expect(result!.notes).toEqual('Check tire pressure');
  });

  it('should update due_date correctly', async () => {
    // First create an upcoming service
    const createdService = await db.insert(upcomingServicesTable)
      .values({
        car_id: (testCarInput as any).id,
        service_type: 'Oil Change',
        due_date: '2023-12-31',
        due_mileage: 30000,
        notes: 'Synthetic oil recommended'
      })
      .returning()
      .execute();
    
    const serviceId = createdService[0].id;
    const newDueDate = new Date('2024-06-15');
    
    // Update the service
    const updateInput: UpdateUpcomingServiceInput = {
      id: serviceId,
      due_date: newDueDate
    };
    
    const result = await updateUpcomingService(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.due_date).toEqual(newDueDate);
  });

  it('should return null for non-existent service', async () => {
    const updateInput: UpdateUpcomingServiceInput = {
      id: 99999, // Non-existent ID
      service_type: 'Brake Inspection'
    };
    
    const result = await updateUpcomingService(updateInput);
    
    expect(result).toBeNull();
  });

  it('should update service in database', async () => {
    // First create an upcoming service
    const createdService = await db.insert(upcomingServicesTable)
      .values({
        car_id: (testCarInput as any).id,
        service_type: 'Oil Change',
        due_date: '2023-12-31',
        due_mileage: 30000,
        notes: 'Synthetic oil recommended'
      })
      .returning()
      .execute();
    
    const serviceId = createdService[0].id;
    
    // Update the service
    const updateInput: UpdateUpcomingServiceInput = {
      id: serviceId,
      service_type: 'Engine Tune-up',
      due_mileage: 40000
    };
    
    await updateUpcomingService(updateInput);
    
    // Query database to verify update
    const services = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, serviceId))
      .execute();
    
    expect(services).toHaveLength(1);
    expect(services[0].service_type).toEqual('Engine Tune-up');
    expect(services[0].due_mileage).toEqual(40000);
  });

  it('should handle partial updates correctly', async () => {
    // First create an upcoming service
    const createdService = await db.insert(upcomingServicesTable)
      .values({
        car_id: (testCarInput as any).id,
        service_type: 'Oil Change',
        due_date: '2023-12-31',
        due_mileage: 30000,
        notes: 'Synthetic oil recommended'
      })
      .returning()
      .execute();
    
    const serviceId = createdService[0].id;
    
    // Update only service_type
    const updateInput: UpdateUpcomingServiceInput = {
      id: serviceId,
      service_type: 'Transmission Fluid Change'
    };
    
    const result = await updateUpcomingService(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.service_type).toEqual('Transmission Fluid Change');
    // Other fields should remain unchanged
    expect(result!.due_mileage).toEqual(30000);
    expect(result!.notes).toEqual('Synthetic oil recommended');
  });
});
