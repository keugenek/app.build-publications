import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable } from '../db/schema';
import { getInstructors } from '../handlers/get_instructors';

describe('getInstructors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no instructors exist', async () => {
    const result = await getInstructors();
    expect(result).toEqual([]);
  });

  it('should fetch all instructors with their information', async () => {
    // Create test users first
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'John Instructor',
          email: 'john@example.com',
          role: 'instructor'
        },
        {
          name: 'Jane Instructor',
          email: 'jane@example.com',
          role: 'instructor'
        }
      ])
      .returning()
      .execute();

    // Create instructors linked to the users
    await db.insert(instructorsTable)
      .values([
        {
          user_id: users[0].id,
          specialization: 'Yoga',
          bio: 'Experienced yoga instructor'
        },
        {
          user_id: users[1].id,
          specialization: 'Pilates',
          bio: 'Certified pilates trainer'
        }
      ])
      .execute();

    const result = await getInstructors();

    expect(result).toHaveLength(2);
    
    // Verify first instructor
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].specialization).toEqual('Yoga');
    expect(result[0].bio).toEqual('Experienced yoga instructor');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second instructor
    expect(result[1].user_id).toEqual(users[1].id);
    expect(result[1].specialization).toEqual('Pilates');
    expect(result[1].bio).toEqual('Certified pilates trainer');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle instructors with nullable fields', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Basic Instructor',
        email: 'basic@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create instructor with null specialization and bio
    await db.insert(instructorsTable)
      .values({
        user_id: user[0].id,
        specialization: null,
        bio: null
      })
      .execute();

    const result = await getInstructors();

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user[0].id);
    expect(result[0].specialization).toBeNull();
    expect(result[0].bio).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should only return instructors linked to existing users', async () => {
    // Create test users - one instructor, one member
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Instructor User',
          email: 'instructor@example.com',
          role: 'instructor'
        },
        {
          name: 'Member User',
          email: 'member@example.com',
          role: 'member'
        }
      ])
      .returning()
      .execute();

    // Only create instructor record for the first user
    await db.insert(instructorsTable)
      .values({
        user_id: users[0].id,
        specialization: 'CrossFit',
        bio: 'CrossFit Level 2 trainer'
      })
      .execute();

    const result = await getInstructors();

    // Should only return the one instructor record
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].specialization).toEqual('CrossFit');
  });

  it('should return instructors ordered by creation date', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'First Instructor',
          email: 'first@example.com',
          role: 'instructor'
        },
        {
          name: 'Second Instructor',
          email: 'second@example.com',
          role: 'instructor'
        }
      ])
      .returning()
      .execute();

    // Create instructors with slight delay to ensure different timestamps
    const firstInstructor = await db.insert(instructorsTable)
      .values({
        user_id: users[0].id,
        specialization: 'First Specialty',
        bio: 'First bio'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondInstructor = await db.insert(instructorsTable)
      .values({
        user_id: users[1].id,
        specialization: 'Second Specialty',
        bio: 'Second bio'
      })
      .returning()
      .execute();

    const result = await getInstructors();

    expect(result).toHaveLength(2);
    
    // Verify that we get both instructors (order may vary)
    const instructorIds = result.map(i => i.id).sort();
    const expectedIds = [firstInstructor[0].id, secondInstructor[0].id].sort();
    expect(instructorIds).toEqual(expectedIds);
    
    // Verify all instructors have valid timestamps
    result.forEach(instructor => {
      expect(instructor.created_at).toBeInstanceOf(Date);
    });
  });
});
