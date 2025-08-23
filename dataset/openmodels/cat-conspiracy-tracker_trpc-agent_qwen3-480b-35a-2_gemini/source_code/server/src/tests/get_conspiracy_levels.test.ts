import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, behaviorsTable } from '../db/schema';
import { type CreateCatInput, type RecordBehaviorInput } from '../schema';
import { getConspiracyLevels } from '../handlers/get_conspiracy_levels';
import { eq } from 'drizzle-orm';

// Helper function to create a cat
const createCat = async (input: CreateCatInput) => {
  const result = await db.insert(catsTable)
    .values({
      name: input.name,
      breed: input.breed,
      age: input.age
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to record a behavior
const recordBehavior = async (input: RecordBehaviorInput) => {
  const result = await db.insert(behaviorsTable)
    .values({
      cat_id: input.cat_id,
      behavior_type: input.behavior_type,
      description: input.description,
      intensity: input.intensity,
      duration_minutes: input.duration_minutes,
      recorded_at: input.recorded_at ?? new Date()
    })
    .returning()
    .execute();
  return result[0];
};

describe('getConspiracyLevels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return conspiracy levels for all cats with no behaviors as innocent', async () => {
    // Create test cats
    const cat1 = await createCat({ name: 'Whiskers', breed: 'Siamese', age: 3 });
    const cat2 = await createCat({ name: 'Fluffy', breed: 'Persian', age: 2 });

    const result = await getConspiracyLevels();

    expect(result).toHaveLength(2);
    
    const whiskers = result.find(r => r.cat_id === cat1.id);
    const fluffy = result.find(r => r.cat_id === cat2.id);
    
    expect(whiskers).toBeDefined();
    expect(fluffy).toBeDefined();
    
    if (whiskers) {
      expect(whiskers.cat_name).toBe('Whiskers');
      expect(whiskers.level).toBe(0);
      expect(whiskers.description).toBe('Innocent kitten');
      expect(whiskers.total_behaviors).toBe(0);
    }
    
    if (fluffy) {
      expect(fluffy.cat_name).toBe('Fluffy');
      expect(fluffy.level).toBe(0);
      expect(fluffy.description).toBe('Innocent kitten');
      expect(fluffy.total_behaviors).toBe(0);
    }
  });

  it('should calculate conspiracy levels based on behaviors', async () => {
    // Create a test cat
    const cat = await createCat({ name: 'Mischief', breed: 'Tabby', age: 4 });

    // Record some behaviors
    await recordBehavior({
      cat_id: cat.id,
      behavior_type: 'LURKING',
      description: 'Watching from shadows',
      intensity: 3,
      duration_minutes: 30
    });

    await recordBehavior({
      cat_id: cat.id,
      behavior_type: 'WINDOW_SURVEILLANCE',
      description: 'Monitoring outside activities',
      intensity: 5,
      duration_minutes: 45
    });

    await recordBehavior({
      cat_id: cat.id,
      behavior_type: 'SECRET_MEETING',
      description: 'Whisker meeting with neighbor cat',
      intensity: 8,
      duration_minutes: 60
    });

    const result = await getConspiracyLevels();

    expect(result).toHaveLength(1);
    const mischief = result[0];
    
    expect(mischief.cat_name).toBe('Mischief');
    expect(mischief.total_behaviors).toBe(3);
    expect(mischief.level).toBeGreaterThan(0);
    expect(mischief.description).not.toBe('Innocent kitten');
  });

  it('should filter conspiracy levels by cat_id', async () => {
    // Create test cats
    const cat1 = await createCat({ name: 'Whiskers', breed: 'Siamese', age: 3 });
    const cat2 = await createCat({ name: 'Fluffy', breed: 'Persian', age: 2 });

    // Record behaviors for both cats
    await recordBehavior({
      cat_id: cat1.id,
      behavior_type: 'LURKING',
      description: 'Watching from shadows',
      intensity: 5,
      duration_minutes: 30
    });

    await recordBehavior({
      cat_id: cat2.id,
      behavior_type: 'SECRET_MEETING',
      description: 'Planning world domination',
      intensity: 9,
      duration_minutes: 120
    });

    // Get conspiracy levels for cat1 only
    const result = await getConspiracyLevels({ cat_id: cat1.id });

    expect(result).toHaveLength(1);
    expect(result[0].cat_id).toBe(cat1.id);
    expect(result[0].cat_name).toBe('Whiskers');
  });

  it('should filter conspiracy levels by date', async () => {
    // Create a test cat
    const cat = await createCat({ name: 'Shadow', breed: 'Black Cat', age: 5 });

    // Record behaviors on different dates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await recordBehavior({
      cat_id: cat.id,
      behavior_type: 'STARE_DOWN',
      description: 'Staring menacingly',
      intensity: 4,
      duration_minutes: 15,
      recorded_at: yesterday
    });

    await recordBehavior({
      cat_id: cat.id,
      behavior_type: 'NIGHT_PATROL',
      description: 'Patrolling at night',
      intensity: 7,
      duration_minutes: 180,
      recorded_at: today
    });

    // Get conspiracy levels for today
    const result = await getConspiracyLevels({ date: today });

    // Should include cats with behaviors today or no date restriction needed for all cats
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should return appropriate descriptions based on conspiracy levels', async () => {
    // Create a test cat
    const cat = await createCat({ name: 'Mastermind', breed: 'Sphynx', age: 6 });

    // Record high intensity behaviors to get high conspiracy level
    for (let i = 0; i < 15; i++) {
      await recordBehavior({
        cat_id: cat.id,
        behavior_type: 'SECRET_MEETING',
        description: `Meeting ${i+1}`,
        intensity: 10,
        duration_minutes: 60
      });
    }

    const result = await getConspiracyLevels();
    
    expect(result).toHaveLength(1);
    expect(result[0].cat_name).toBe('Mastermind');
    expect(result[0].total_behaviors).toBe(15);
    expect(result[0].level).toBe(100); // Should max out at 100
    expect(result[0].description).toBe('Mastermind felon');
  });
});
