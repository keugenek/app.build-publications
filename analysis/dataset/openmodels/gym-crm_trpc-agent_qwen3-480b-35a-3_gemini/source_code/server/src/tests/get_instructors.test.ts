import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { instructorsTable } from '../db/schema';
import { getInstructors } from '../handlers/get_instructors';

describe('getInstructors', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(instructorsTable).values([
      {
        name: 'John Doe',
        email: 'john@example.com'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com'
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all instructors from the database', async () => {
    const instructors = await getInstructors();

    expect(instructors).toHaveLength(2);
    
    // Check first instructor
    expect(instructors[0]).toEqual({
      id: expect.any(Number),
      name: 'John Doe',
      email: 'john@example.com',
      created_at: expect.any(Date)
    });
    
    // Check second instructor
    expect(instructors[1]).toEqual({
      id: expect.any(Number),
      name: 'Jane Smith',
      email: 'jane@example.com',
      created_at: expect.any(Date)
    });
  });

  it('should return an empty array when no instructors exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const instructors = await getInstructors();
    
    expect(instructors).toHaveLength(0);
    expect(instructors).toEqual([]);
  });

  it('should preserve the correct data types', async () => {
    const instructors = await getInstructors();
    
    expect(instructors).toHaveLength(2);
    
    // Check that all fields have the correct types
    instructors.forEach(instructor => {
      expect(typeof instructor.id).toBe('number');
      expect(typeof instructor.name).toBe('string');
      expect(typeof instructor.email).toBe('string');
      expect(instructor.created_at).toBeInstanceOf(Date);
    });
  });
});
