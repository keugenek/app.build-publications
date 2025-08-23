import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { getActivities } from '../handlers/get_activities';
import { eq } from 'drizzle-orm';

// Test inputs for activities
const testActivities: CreateActivityInput[] = [
  {
    description: 'Stared at the wall for 30 minutes',
    activity_type: 'Prolonged Staring',
    date: new Date('2023-05-15')
  },
  {
    description: 'Ran around the house at 3am',
    activity_type: 'Midnight Zoomies',
    date: new Date('2023-05-16')
  },
  {
    description: 'Left a dead mouse on the bed',
    activity_type: 'Leaving \'Gifts\' (dead insects, toys, etc.)',
    date: new Date('2023-05-17')
  }
];

describe('getActivities', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const activity of testActivities) {
      let score = 0;
      switch (activity.activity_type) {
        case 'Prolonged Staring': score = 3; break;
        case 'Midnight Zoomies': score = 5; break;
        case 'Leaving \'Gifts\' (dead insects, toys, etc.)': score = 7; break;
        case 'Silent Judgment': score = 4; break;
        case 'Plotting on the Keyboard': score = 6; break;
      }
      
      // Convert dates to strings for database insertion
      await db.insert(activitiesTable).values({
        description: activity.description,
        activity_type: activity.activity_type,
        suspicion_score: score,
        date: activity.date!.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
      }).execute();
    }
  });
  
  afterEach(resetDB);

  it('should fetch all activities from the database', async () => {
    const results = await getActivities();

    expect(results).toHaveLength(3);
    
    // Check first activity
    expect(results[0].description).toEqual('Stared at the wall for 30 minutes');
    expect(results[0].activity_type).toEqual('Prolonged Staring');
    expect(results[0].suspicion_score).toEqual(3);
    expect(results[0].date).toEqual(new Date('2023-05-15'));
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    
    // Check second activity
    expect(results[1].description).toEqual('Ran around the house at 3am');
    expect(results[1].activity_type).toEqual('Midnight Zoomies');
    expect(results[1].suspicion_score).toEqual(5);
    expect(results[1].date).toEqual(new Date('2023-05-16'));
    
    // Check third activity
    expect(results[2].description).toEqual('Left a dead mouse on the bed');
    expect(results[2].activity_type).toEqual('Leaving \'Gifts\' (dead insects, toys, etc.)');
    expect(results[2].suspicion_score).toEqual(7);
    expect(results[2].date).toEqual(new Date('2023-05-17'));
  });

  it('should return an empty array when no activities exist', async () => {
    // Clear all activities
    await db.delete(activitiesTable).execute();
    
    const results = await getActivities();
    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should maintain proper date types', async () => {
    const results = await getActivities();
    
    results.forEach(activity => {
      expect(activity.created_at).toBeInstanceOf(Date);
      expect(activity.date).toBeInstanceOf(Date);
      expect(typeof activity.suspicion_score).toBe('number');
      expect(activity.suspicion_score % 1).toBe(0); // Should be an integer
    });
  });
});
