import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';
import { getChores } from '../handlers/get_chores';
import { eq } from 'drizzle-orm';

// Sample chore data
const testChore: Omit<Chore, 'id' | 'created_at'> = {
  title: 'Take out trash',
  description: 'Dispose of household waste',
};

describe('getChores handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no chores exist', async () => {
    const result = await getChores();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should retrieve all chores from the database', async () => {
    // Insert a chore directly via drizzle
    const inserted = await db.insert(choresTable).values({
      title: testChore.title,
      description: testChore.description,
    }).returning().execute();

    const insertedChore = inserted[0];

    const result = await getChores();

    expect(result).toHaveLength(1);
    const fetched = result[0];
    expect(fetched.id).toBe(insertedChore.id);
    expect(fetched.title).toBe(testChore.title);
    expect(fetched.description).toBe(testChore.description);
    expect(fetched.created_at).toBeInstanceOf(Date);
  });

  it('should include multiple chores and preserve order of insertion', async () => {
    const choresToInsert = [
      { title: 'Wash dishes', description: null },
      { title: 'Mow lawn', description: 'Cut the grass' },
    ];

    // Insert multiple chores
    await db.insert(choresTable).values(choresToInsert as any).execute();

    const result = await getChores();
    expect(result).toHaveLength(2);
    // Verify that each inserted chore appears in the result
    choresToInsert.forEach(ch => {
      const found = result.find(r => r.title === ch.title && r.description === ch.description);
      expect(found).toBeDefined();
    });
  });
});
