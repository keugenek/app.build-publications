import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { getPlants } from '../handlers/get_plants';
import { type CreatePlantInput } from '../schema';
import { eq } from 'drizzle-orm';

describe('getPlants', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(plantsTable).values([
      {
        name: 'Rose',
        lastWateredDate: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01')
      },
      {
        name: 'Tulip',
        lastWateredDate: new Date('2023-01-02'),
        createdAt: new Date('2023-01-02')
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all plants from the database', async () => {
    const plants = await getPlants();

    expect(plants).toHaveLength(2);
    expect(plants[0].name).toBe('Rose');
    expect(plants[1].name).toBe('Tulip');
    
    // Check that dates are properly handled
    expect(plants[0].lastWateredDate).toBeInstanceOf(Date);
    expect(plants[0].createdAt).toBeInstanceOf(Date);
    expect(plants[1].lastWateredDate).toBeInstanceOf(Date);
    expect(plants[1].createdAt).toBeInstanceOf(Date);
  });

  it('should return an empty array when no plants exist', async () => {
    // Clear all plants
    await db.delete(plantsTable).execute();
    
    const plants = await getPlants();
    
    expect(plants).toHaveLength(0);
  });

  it('should return plants ordered by creation date', async () => {
    const plants = await getPlants();
    
    // Should be ordered by createdAt (ascending)
    expect(plants[0].createdAt.getTime()).toBeLessThan(plants[1].createdAt.getTime());
  });
});
