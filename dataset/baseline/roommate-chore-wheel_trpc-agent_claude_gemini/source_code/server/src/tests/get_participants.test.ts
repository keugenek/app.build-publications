import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { getParticipants } from '../handlers/get_participants';

describe('getParticipants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no participants exist', async () => {
    const result = await getParticipants();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all participants when they exist', async () => {
    // Create test participants
    await db.insert(participantsTable)
      .values([
        { name: 'Alice Johnson' },
        { name: 'Bob Smith' },
        { name: 'Charlie Brown' }
      ])
      .execute();

    const result = await getParticipants();

    expect(result).toHaveLength(3);
    expect(result.map(p => p.name)).toEqual(['Alice Johnson', 'Bob Smith', 'Charlie Brown']);
    
    // Verify each participant has all required fields
    result.forEach(participant => {
      expect(participant.id).toBeDefined();
      expect(typeof participant.id).toBe('number');
      expect(typeof participant.name).toBe('string');
      expect(participant.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return participants with correct field types', async () => {
    // Create a single test participant
    await db.insert(participantsTable)
      .values({ name: 'Test User' })
      .execute();

    const result = await getParticipants();

    expect(result).toHaveLength(1);
    const participant = result[0];
    
    expect(typeof participant.id).toBe('number');
    expect(typeof participant.name).toBe('string');
    expect(participant.created_at).toBeInstanceOf(Date);
    expect(participant.name).toBe('Test User');
  });

  it('should return participants ordered by insertion order', async () => {
    // Insert participants in specific order
    const names = ['First Participant', 'Second Participant', 'Third Participant'];
    
    for (const name of names) {
      await db.insert(participantsTable)
        .values({ name })
        .execute();
    }

    const result = await getParticipants();

    expect(result).toHaveLength(3);
    expect(result.map(p => p.name)).toEqual(names);
    
    // Verify IDs are in ascending order (natural insertion order)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].id).toBeGreaterThan(result[i - 1].id);
    }
  });

  it('should handle participants with special characters in names', async () => {
    const specialNames = [
      "O'Connor",
      "José García",
      "李小明",
      "User with spaces",
      "user@domain.com"
    ];

    await db.insert(participantsTable)
      .values(specialNames.map(name => ({ name })))
      .execute();

    const result = await getParticipants();

    expect(result).toHaveLength(specialNames.length);
    expect(result.map(p => p.name).sort()).toEqual(specialNames.sort());
  });
});
