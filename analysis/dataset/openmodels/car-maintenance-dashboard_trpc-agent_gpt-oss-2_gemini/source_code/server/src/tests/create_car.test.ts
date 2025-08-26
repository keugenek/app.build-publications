import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { createCar, getCars, getCar, updateCar, deleteCar } from '../handlers/create_car';
import { type CreateCarInput, type UpdateCarInput } from '../schema';

const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  license_plate: 'ABC123'
};

describe('Car handlers integration tests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car and retrieve it', async () => {
    const created = await createCar(testCar);
    expect(created.id).toBeDefined();
    expect(created.make).toBe('Toyota');
    expect(created.model).toBe('Corolla');
    expect(created.year).toBe(2020);
    expect(created.license_plate).toBe('ABC123');
    expect(created.created_at).toBeInstanceOf(Date);

    const fetched = await getCar(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.license_plate).toBe('ABC123');
  });

  it('should list cars', async () => {
    await createCar(testCar);
    const list = await getCars();
    expect(list.length).toBeGreaterThan(0);
    const car = list.find(c => c.license_plate === testCar.license_plate);
    expect(car).toBeDefined();
    expect(car?.make).toBe('Toyota');
  });

  it('should update a car', async () => {
    const created = await createCar(testCar);
    const update: UpdateCarInput = {
      id: created.id,
      model: 'Camry',
      year: 2021
    };
    const updated = await updateCar(update);
    expect(updated.id).toBe(created.id);
    expect(updated.model).toBe('Camry');
    expect(updated.year).toBe(2021);
    // unchanged fields remain the same
    expect(updated.make).toBe(created.make);
    expect(updated.license_plate).toBe(created.license_plate);
  });

  it('should delete a car', async () => {
    const created = await createCar(testCar);
    const success = await deleteCar(created.id);
    expect(success).toBe(true);
    const fetched = await getCar(created.id);
    expect(fetched).toBeNull();
  });
});
