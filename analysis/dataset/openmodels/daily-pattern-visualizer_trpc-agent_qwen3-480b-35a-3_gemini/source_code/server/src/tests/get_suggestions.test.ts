import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suggestionsTable } from '../db/schema';
import { getSuggestions } from '../handlers/get_suggestions';
import { eq } from 'drizzle-orm';

describe('getSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no suggestions exist for a user', async () => {
    const result = await getSuggestions('user-123');
    expect(result).toEqual([]);
  });

  it('should return suggestions for a specific user', async () => {
    // Insert test suggestions
    const testSuggestions = [
      {
        user_id: 'user-123',
        message: 'Take a 10-minute break',
        suggestion_type: 'break',
      },
      {
        user_id: 'user-123',
        message: 'Consider going to bed earlier',
        suggestion_type: 'sleep',
      },
      {
        user_id: 'user-456', // Different user
        message: 'Schedule a social activity',
        suggestion_type: 'social',
      }
    ];

    // Insert all suggestions
    for (const suggestion of testSuggestions) {
      await db.insert(suggestionsTable).values(suggestion).execute();
    }

    // Get suggestions for user-123
    const result = await getSuggestions('user-123');

    // Should only return 2 suggestions for user-123
    expect(result).toHaveLength(2);
    
    // Validate the content of returned suggestions
    expect(result[0].user_id).toEqual('user-123');
    expect(result[0].message).toEqual('Take a 10-minute break');
    expect(result[0].suggestion_type).toEqual('break');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].user_id).toEqual('user-123');
    expect(result[1].message).toEqual('Consider going to bed earlier');
    expect(result[1].suggestion_type).toEqual('sleep');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return suggestions ordered by creation date', async () => {
    // Insert suggestions in a specific order
    const suggestionData = [
      {
        user_id: 'user-xyz',
        message: 'First suggestion',
        suggestion_type: 'break',
      },
      {
        user_id: 'user-xyz',
        message: 'Second suggestion',
        suggestion_type: 'rest',
      }
    ];

    // Insert suggestions
    for (const suggestion of suggestionData) {
      await db.insert(suggestionsTable).values(suggestion).execute();
    }

    const result = await getSuggestions('user-xyz');
    
    // Should return suggestions in the order they were created (oldest first)
    expect(result).toHaveLength(2);
    expect(result[0].message).toEqual('First suggestion');
    expect(result[1].message).toEqual('Second suggestion');
  });

  it('should handle errors gracefully', async () => {
    // Test with an invalid user ID that might cause issues
    const result = await getSuggestions('');
    expect(result).toEqual([]);
  });
});
