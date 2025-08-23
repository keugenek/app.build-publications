import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, behaviorsTable } from '../db/schema';
import { getBehaviors } from '../handlers/get_behaviors';
import { eq } from 'drizzle-orm';

describe('getBehaviors', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test cat first (needed for foreign key constraint)
    const [cat] = await db.insert(catsTable)
      .values({
        name: 'Fluffy',
        breed: 'Persian',
        age: 3
      })
      .returning()
      .execute();
      
    // Insert some test behaviors
    await db.insert(behaviorsTable)
      .values([
        {
          cat_id: cat.id,
          behavior_type: 'STARE_DOWN',
          description: 'Intense staring at human',
          intensity: 8,
          duration_minutes: 45,
          recorded_at: new Date()
        },
        {
          cat_id: cat.id,
          behavior_type: 'NIGHT_PATROL',
          description: 'Running around at 3am',
          intensity: 10,
          duration_minutes: null,
          recorded_at: new Date()
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all behaviors from the database', async () => {
    const behaviors = await getBehaviors();

    expect(behaviors).toHaveLength(2);
    
    // Check first behavior
    const behavior1 = behaviors.find(b => b.behavior_type === 'STARE_DOWN');
    expect(behavior1).toBeDefined();
    expect(behavior1!.cat_id).toBeTypeOf('number');
    expect(behavior1!.behavior_type).toEqual('STARE_DOWN');
    expect(behavior1!.description).toEqual('Intense staring at human');
    expect(behavior1!.intensity).toEqual(8);
    expect(behavior1!.duration_minutes).toEqual(45);
    expect(behavior1!.recorded_at).toBeInstanceOf(Date);
    expect(behavior1!.created_at).toBeInstanceOf(Date);
    
    // Check second behavior
    const behavior2 = behaviors.find(b => b.behavior_type === 'NIGHT_PATROL');
    expect(behavior2).toBeDefined();
    expect(behavior2!.behavior_type).toEqual('NIGHT_PATROL');
    expect(behavior2!.description).toEqual('Running around at 3am');
    expect(behavior2!.intensity).toEqual(10);
    expect(behavior2!.duration_minutes).toBeNull();
    expect(behavior2!.recorded_at).toBeInstanceOf(Date);
    expect(behavior2!.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no behaviors exist', async () => {
    // Clear all behaviors
    await db.delete(behaviorsTable).execute();
    
    const behaviors = await getBehaviors();
    
    expect(behaviors).toHaveLength(0);
    expect(behaviors).toEqual([]);
  });
});
