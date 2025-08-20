import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceHistoryTable } from '../db/schema';
import { type CreateMaintenanceHistoryInput } from '../schema';
import { createMaintenanceHistory } from '../handlers/create_maintenance_history';
import { eq } from 'drizzle-orm';

// Test car data
const testCarData = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1HGBH41JXMN109186'
};

// Test maintenance history input
const testMaintenanceInput: CreateMaintenanceHistoryInput = {
  car_id: 0, // Will be set after creating car
  service_date: new Date('2023-06-15'),
  service_type: 'Oil Change',
  mileage: 25000,
  cost: 49.99,
  notes: 'Regular maintenance service'
};

describe('createMaintenanceHistory', () => {
  let testCarId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    testCarId = carResult[0].id;
  });

  afterEach(resetDB);

  it('should create maintenance history record', async () => {
    const input = { ...testMaintenanceInput, car_id: testCarId };
    const result = await createMaintenanceHistory(input);

    // Basic field validation
    expect(result.car_id).toEqual(testCarId);
    expect(result.service_date).toEqual(input.service_date);
    expect(result.service_type).toEqual('Oil Change');
    expect(result.mileage).toEqual(25000);
    expect(result.cost).toEqual(49.99);
    expect(typeof result.cost).toBe('number'); // Verify numeric conversion
    expect(result.notes).toEqual('Regular maintenance service');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save maintenance history to database', async () => {
    const input = { ...testMaintenanceInput, car_id: testCarId };
    const result = await createMaintenanceHistory(input);

    // Query database to verify record was saved
    const maintenanceRecords = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, result.id))
      .execute();

    expect(maintenanceRecords).toHaveLength(1);
    const savedRecord = maintenanceRecords[0];
    expect(savedRecord.car_id).toEqual(testCarId);
    expect(savedRecord.service_type).toEqual('Oil Change');
    expect(savedRecord.mileage).toEqual(25000);
    expect(parseFloat(savedRecord.cost)).toEqual(49.99); // Cost stored as string in DB
    expect(savedRecord.notes).toEqual('Regular maintenance service');
    expect(savedRecord.created_at).toBeInstanceOf(Date);
  });

  it('should handle null notes correctly', async () => {
    const input = { 
      ...testMaintenanceInput, 
      car_id: testCarId, 
      notes: null 
    };
    const result = await createMaintenanceHistory(input);

    expect(result.notes).toBeNull();
    expect(result.service_type).toEqual('Oil Change');
    expect(result.cost).toEqual(49.99);
  });

  it('should handle different service types and costs', async () => {
    const input = {
      car_id: testCarId,
      service_date: new Date('2023-08-20'),
      service_type: 'Brake Replacement',
      mileage: 30000,
      cost: 299.50,
      notes: 'Front brake pads replaced'
    };

    const result = await createMaintenanceHistory(input);

    expect(result.service_type).toEqual('Brake Replacement');
    expect(result.cost).toEqual(299.50);
    expect(typeof result.cost).toBe('number');
    expect(result.mileage).toEqual(30000);
    expect(result.notes).toEqual('Front brake pads replaced');
  });

  it('should throw error when car does not exist', async () => {
    const input = { 
      ...testMaintenanceInput, 
      car_id: 99999 // Non-existent car ID
    };

    expect(createMaintenanceHistory(input)).rejects.toThrow(/car with id 99999 not found/i);
  });

  it('should handle zero cost correctly', async () => {
    const input = {
      ...testMaintenanceInput,
      car_id: testCarId,
      cost: 0,
      service_type: 'Warranty Repair',
      notes: 'Covered under warranty'
    };

    const result = await createMaintenanceHistory(input);
    
    expect(result.cost).toEqual(0);
    expect(typeof result.cost).toBe('number');
    expect(result.service_type).toEqual('Warranty Repair');
  });

  it('should maintain foreign key relationship', async () => {
    const input = { ...testMaintenanceInput, car_id: testCarId };
    const result = await createMaintenanceHistory(input);

    // Verify the car-maintenance relationship through join
    const joinResult = await db.select({
      maintenanceId: maintenanceHistoryTable.id,
      carMake: carsTable.make,
      carModel: carsTable.model,
      serviceType: maintenanceHistoryTable.service_type
    })
      .from(maintenanceHistoryTable)
      .innerJoin(carsTable, eq(maintenanceHistoryTable.car_id, carsTable.id))
      .where(eq(maintenanceHistoryTable.id, result.id))
      .execute();

    expect(joinResult).toHaveLength(1);
    expect(joinResult[0].maintenanceId).toEqual(result.id);
    expect(joinResult[0].carMake).toEqual('Toyota');
    expect(joinResult[0].carModel).toEqual('Camry');
    expect(joinResult[0].serviceType).toEqual('Oil Change');
  });
});
