import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable, upcomingServicesTable } from '../db/schema';
import { type DeleteRecordInput, type CreateCarInput, type CreateMaintenanceRecordInput, type CreateUpcomingServiceInput } from '../schema';
import { deleteCar } from '../handlers/delete_car';
import { eq } from 'drizzle-orm';

// Test input for car creation
const testCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1234567890ABCDEFG',
  license_plate: 'ABC123',
  current_mileage: 25000
};

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a car successfully', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: testCarInput.make,
        model: testCarInput.model,
        year: testCarInput.year,
        vin: testCarInput.vin,
        license_plate: testCarInput.license_plate,
        current_mileage: testCarInput.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];
    const deleteInput: DeleteRecordInput = { id: car.id };

    // Delete the car
    const result = await deleteCar(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify car is deleted from database
    const deletedCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(deletedCars).toHaveLength(0);
  });

  it('should cascade delete related maintenance records', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCarInput.make,
        model: testCarInput.model,
        year: testCarInput.year,
        vin: testCarInput.vin,
        license_plate: testCarInput.license_plate,
        current_mileage: testCarInput.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance records for the car
    const maintenanceInput: CreateMaintenanceRecordInput = {
      car_id: car.id,
      service_date: new Date('2024-01-15'),
      service_type: 'oil_change',
      description: 'Regular oil change',
      cost: 45.99,
      mileage: 25000,
      notes: 'Used synthetic oil'
    };

    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: maintenanceInput.car_id,
        service_date: maintenanceInput.service_date,
        service_type: maintenanceInput.service_type,
        description: maintenanceInput.description,
        cost: maintenanceInput.cost.toString(),
        mileage: maintenanceInput.mileage,
        notes: maintenanceInput.notes
      })
      .execute();

    // Delete the car
    const deleteInput: DeleteRecordInput = { id: car.id };
    const result = await deleteCar(deleteInput);

    expect(result.success).toBe(true);

    // Verify maintenance records are also deleted
    const remainingRecords = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, car.id))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });

  it('should cascade delete related upcoming services', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCarInput.make,
        model: testCarInput.model,
        year: testCarInput.year,
        vin: testCarInput.vin,
        license_plate: testCarInput.license_plate,
        current_mileage: testCarInput.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create upcoming service for the car
    const upcomingServiceInput: CreateUpcomingServiceInput = {
      car_id: car.id,
      service_type: 'tire_rotation',
      description: 'Rotate tires',
      due_date: new Date('2024-03-15'),
      due_mileage: 30000,
      notes: 'Check tire pressure too'
    };

    await db.insert(upcomingServicesTable)
      .values({
        car_id: upcomingServiceInput.car_id,
        service_type: upcomingServiceInput.service_type,
        description: upcomingServiceInput.description,
        due_date: upcomingServiceInput.due_date,
        due_mileage: upcomingServiceInput.due_mileage,
        notes: upcomingServiceInput.notes
      })
      .execute();

    // Delete the car
    const deleteInput: DeleteRecordInput = { id: car.id };
    const result = await deleteCar(deleteInput);

    expect(result.success).toBe(true);

    // Verify upcoming services are also deleted
    const remainingServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.car_id, car.id))
      .execute();

    expect(remainingServices).toHaveLength(0);
  });

  it('should cascade delete both maintenance records and upcoming services', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCarInput.make,
        model: testCarInput.model,
        year: testCarInput.year,
        vin: testCarInput.vin,
        license_plate: testCarInput.license_plate,
        current_mileage: testCarInput.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create both maintenance record and upcoming service
    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_date: new Date('2024-01-15'),
        service_type: 'oil_change',
        description: 'Regular oil change',
        cost: '45.99',
        mileage: 25000,
        notes: 'Used synthetic oil'
      })
      .execute();

    await db.insert(upcomingServicesTable)
      .values({
        car_id: car.id,
        service_type: 'brake_service',
        description: 'Brake inspection',
        due_date: new Date('2024-04-15'),
        due_mileage: 32000,
        notes: 'Check brake pads and fluid'
      })
      .execute();

    // Delete the car
    const deleteInput: DeleteRecordInput = { id: car.id };
    const result = await deleteCar(deleteInput);

    expect(result.success).toBe(true);

    // Verify both maintenance records and upcoming services are deleted
    const remainingRecords = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, car.id))
      .execute();

    const remainingServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.car_id, car.id))
      .execute();

    expect(remainingRecords).toHaveLength(0);
    expect(remainingServices).toHaveLength(0);
  });

  it('should throw error when car does not exist', async () => {
    const deleteInput: DeleteRecordInput = { id: 999 };

    await expect(deleteCar(deleteInput)).rejects.toThrow(/Car with id 999 not found/i);
  });

  it('should not affect other cars when deleting specific car', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
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

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        vin: '9876543210ZYXWVUT',
        license_plate: 'XYZ789',
        current_mileage: 15000
      })
      .returning()
      .execute();

    const car1 = car1Result[0];
    const car2 = car2Result[0];

    // Create maintenance records for both cars
    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car1.id,
        service_date: new Date('2024-01-15'),
        service_type: 'oil_change',
        description: 'Oil change for car 1',
        cost: '45.99',
        mileage: 25000,
        notes: null
      })
      .execute();

    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car2.id,
        service_date: new Date('2024-01-20'),
        service_type: 'tire_rotation',
        description: 'Tire rotation for car 2',
        cost: '25.00',
        mileage: 15000,
        notes: null
      })
      .execute();

    // Delete only car1
    const deleteInput: DeleteRecordInput = { id: car1.id };
    const result = await deleteCar(deleteInput);

    expect(result.success).toBe(true);

    // Verify car1 is deleted but car2 remains
    const remainingCars = await db.select()
      .from(carsTable)
      .execute();

    expect(remainingCars).toHaveLength(1);
    expect(remainingCars[0].id).toBe(car2.id);

    // Verify car2's maintenance record remains
    const remainingRecords = await db.select()
      .from(maintenanceRecordsTable)
      .execute();

    expect(remainingRecords).toHaveLength(1);
    expect(remainingRecords[0].car_id).toBe(car2.id);
  });
});
