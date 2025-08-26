import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceSchedulesTable } from '../db/schema';
import { type GetServiceSchedulesByCarInput, type CreateCarInput, type CreateServiceScheduleInput } from '../schema';
import { getServiceSchedulesByCarId } from '../handlers/get_service_schedules_by_car';

// Helper function to create a test car
const createTestCar = async (mileage: number = 50000): Promise<number> => {
  const testCarInput: CreateCarInput = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    license_plate: 'TEST123',
    current_mileage: mileage
  };

  const result = await db.insert(carsTable)
    .values(testCarInput)
    .returning()
    .execute();

  return result[0].id;
};

// Helper function to create a test service schedule
const createTestServiceSchedule = async (
  carId: number,
  serviceType: string,
  intervalType: 'mileage' | 'time',
  intervalValue: number,
  lastServiceDate?: Date | null,
  lastServiceMileage?: number | null
): Promise<number> => {
  const scheduleInput: CreateServiceScheduleInput = {
    car_id: carId,
    service_type: serviceType,
    interval_type: intervalType,
    interval_value: intervalValue,
    last_service_date: lastServiceDate || null,
    last_service_mileage: lastServiceMileage || null
  };

  const result = await db.insert(serviceSchedulesTable)
    .values({
      ...scheduleInput,
      is_active: true
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('getServiceSchedulesByCarId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for car with no service schedules', async () => {
    const carId = await createTestCar();
    const input: GetServiceSchedulesByCarInput = { carId };

    const result = await getServiceSchedulesByCarId(input);

    expect(result).toEqual([]);
  });

  it('should throw error for non-existent car', async () => {
    const input: GetServiceSchedulesByCarInput = { carId: 999 };

    await expect(getServiceSchedulesByCarId(input)).rejects.toThrow(/Car with ID 999 not found/i);
  });

  it('should return only active service schedules', async () => {
    const carId = await createTestCar();
    
    // Create active schedule
    await createTestServiceSchedule(carId, 'Oil Change', 'mileage', 5000);
    
    // Create inactive schedule
    await db.insert(serviceSchedulesTable)
      .values({
        car_id: carId,
        service_type: 'Tire Rotation',
        interval_type: 'mileage',
        interval_value: 10000,
        last_service_date: null,
        last_service_mileage: null,
        is_active: false
      })
      .execute();

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].service_type).toEqual('Oil Change');
    expect(result[0].is_active).toBe(true);
  });

  it('should calculate next service mileage for mileage-based schedules', async () => {
    const currentMileage = 50000;
    const carId = await createTestCar(currentMileage);
    const lastServiceMileage = 45000;
    const intervalValue = 5000;
    
    await createTestServiceSchedule(
      carId,
      'Oil Change',
      'mileage',
      intervalValue,
      null,
      lastServiceMileage
    );

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].next_service_mileage).toEqual(lastServiceMileage + intervalValue); // 45000 + 5000 = 50000
    expect(result[0].next_service_date).toBeNull();
  });

  it('should calculate next service mileage when no last service mileage', async () => {
    const currentMileage = 50000;
    const carId = await createTestCar(currentMileage);
    const intervalValue = 5000;
    
    await createTestServiceSchedule(
      carId,
      'Oil Change',
      'mileage',
      intervalValue,
      null,
      null
    );

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].next_service_mileage).toEqual(currentMileage + intervalValue); // 50000 + 5000 = 55000
  });

  it('should calculate next service date for time-based schedules', async () => {
    const carId = await createTestCar();
    const lastServiceDate = new Date('2023-06-01');
    const intervalValue = 6; // 6 months
    
    await createTestServiceSchedule(
      carId,
      'Annual Inspection',
      'time',
      intervalValue,
      lastServiceDate,
      null
    );

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].next_service_date).toBeInstanceOf(Date);
    expect(result[0].next_service_date?.getFullYear()).toEqual(2023);
    expect(result[0].next_service_date?.getMonth()).toEqual(11); // December (0-indexed)
    expect(result[0].next_service_mileage).toBeNull();
  });

  it('should calculate next service date when no last service date', async () => {
    const carId = await createTestCar();
    const intervalValue = 12; // 12 months
    
    await createTestServiceSchedule(
      carId,
      'Annual Inspection',
      'time',
      intervalValue,
      null,
      null
    );

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].next_service_date).toBeInstanceOf(Date);
    // Should be approximately current date + 12 months
    const currentDate = new Date();
    const expectedYear = currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
    expect(result[0].next_service_date?.getFullYear()).toBeGreaterThanOrEqual(expectedYear);
  });

  it('should return schedules ordered by priority (overdue first)', async () => {
    const currentMileage = 50000;
    const carId = await createTestCar(currentMileage);
    
    // Create overdue mileage schedule
    await createTestServiceSchedule(
      carId,
      'Overdue Oil Change',
      'mileage',
      5000,
      null,
      40000 // Last service at 40k, next at 45k, car is at 50k (overdue)
    );
    
    // Create future mileage schedule
    await createTestServiceSchedule(
      carId,
      'Future Brake Service',
      'mileage',
      10000,
      null,
      45000 // Last service at 45k, next at 55k, car is at 50k (future)
    );
    
    // Create overdue time schedule (past date)
    const overdueDate = new Date();
    overdueDate.setMonth(overdueDate.getMonth() - 12); // 12 months ago
    await createTestServiceSchedule(
      carId,
      'Overdue Inspection',
      'time',
      6,
      overdueDate,
      null
    );

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(3);
    
    // Verify overdue services are first
    const overdueServices = result.filter((schedule, index) => {
      if (schedule.interval_type === 'mileage') {
        return schedule.next_service_mileage !== null && currentMileage >= schedule.next_service_mileage;
      } else {
        return schedule.next_service_date !== null && new Date() > schedule.next_service_date;
      }
    });
    
    expect(overdueServices.length).toBeGreaterThan(0);
    
    // First two should be overdue (oil change and inspection)
    expect(['Overdue Oil Change', 'Overdue Inspection']).toContain(result[0].service_type);
    expect(['Overdue Oil Change', 'Overdue Inspection']).toContain(result[1].service_type);
    
    // Last should be the future service
    expect(result[2].service_type).toEqual('Future Brake Service');
  });

  it('should handle mixed interval types correctly', async () => {
    const carId = await createTestCar();
    
    await createTestServiceSchedule(carId, 'Oil Change', 'mileage', 5000);
    await createTestServiceSchedule(carId, 'Annual Inspection', 'time', 12);
    await createTestServiceSchedule(carId, 'Brake Service', 'mileage', 20000);

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(3);
    
    // Verify each schedule has correct calculated fields
    result.forEach(schedule => {
      if (schedule.interval_type === 'mileage') {
        expect(schedule.next_service_mileage).toBeGreaterThan(0);
        expect(schedule.next_service_date).toBeNull();
      } else {
        expect(schedule.next_service_date).toBeInstanceOf(Date);
        expect(schedule.next_service_mileage).toBeNull();
      }
    });
  });

  it('should preserve all schedule fields in response', async () => {
    const carId = await createTestCar();
    const lastServiceDate = new Date('2023-01-01');
    
    await createTestServiceSchedule(
      carId,
      'Comprehensive Service',
      'time',
      6,
      lastServiceDate,
      45000
    );

    const input: GetServiceSchedulesByCarInput = { carId };
    const result = await getServiceSchedulesByCarId(input);

    expect(result).toHaveLength(1);
    const schedule = result[0];
    
    expect(schedule.id).toBeDefined();
    expect(schedule.car_id).toEqual(carId);
    expect(schedule.service_type).toEqual('Comprehensive Service');
    expect(schedule.interval_type).toEqual('time');
    expect(schedule.interval_value).toEqual(6);
    expect(schedule.last_service_date).toBeInstanceOf(Date);
    expect(schedule.last_service_mileage).toEqual(45000);
    expect(schedule.next_service_date).toBeInstanceOf(Date);
    expect(schedule.next_service_mileage).toBeNull();
    expect(schedule.is_active).toBe(true);
    expect(schedule.created_at).toBeInstanceOf(Date);
    expect(schedule.updated_at).toBeInstanceOf(Date);
  });
});
