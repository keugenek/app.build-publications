import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { getBehaviorTypes } from '../handlers/get_behavior_types';

describe('getBehaviorTypes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no behavior types exist', async () => {
    const result = await getBehaviorTypes();
    
    expect(result).toEqual([]);
  });

  it('should return all behavior types ordered by name', async () => {
    // Create test behavior types
    await db.insert(behaviorTypesTable).values([
      {
        name: 'Zoomies at 3 AM',
        conspiracy_score: 8,
        is_custom: true
      },
      {
        name: 'Aggressive Purring',
        conspiracy_score: 5,
        is_custom: false
      },
      {
        name: 'Box Surveillance',
        conspiracy_score: 9,
        is_custom: true
      }
    ]).execute();

    const result = await getBehaviorTypes();

    expect(result).toHaveLength(3);
    
    // Verify they are ordered by name (alphabetical)
    expect(result[0].name).toEqual('Aggressive Purring');
    expect(result[1].name).toEqual('Box Surveillance');
    expect(result[2].name).toEqual('Zoomies at 3 AM');

    // Verify all fields are present and correct
    expect(result[0].conspiracy_score).toEqual(5);
    expect(result[0].is_custom).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].conspiracy_score).toEqual(9);
    expect(result[1].is_custom).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should include both custom and predefined behavior types', async () => {
    // Create mixed types
    await db.insert(behaviorTypesTable).values([
      {
        name: 'Custom Behavior',
        conspiracy_score: 6,
        is_custom: true
      },
      {
        name: 'Predefined Behavior',
        conspiracy_score: 4,
        is_custom: false
      }
    ]).execute();

    const result = await getBehaviorTypes();

    expect(result).toHaveLength(2);
    
    const customType = result.find(bt => bt.is_custom === true);
    const predefinedType = result.find(bt => bt.is_custom === false);

    expect(customType).toBeDefined();
    expect(customType!.name).toEqual('Custom Behavior');
    expect(customType!.conspiracy_score).toEqual(6);

    expect(predefinedType).toBeDefined();
    expect(predefinedType!.name).toEqual('Predefined Behavior');
    expect(predefinedType!.conspiracy_score).toEqual(4);
  });

  it('should handle single behavior type correctly', async () => {
    await db.insert(behaviorTypesTable).values({
      name: 'Solo Cat Conspiracy',
      conspiracy_score: 10,
      is_custom: true
    }).execute();

    const result = await getBehaviorTypes();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Solo Cat Conspiracy');
    expect(result[0].conspiracy_score).toEqual(10);
    expect(result[0].is_custom).toEqual(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should maintain correct ordering with many behavior types', async () => {
    // Create behavior types with names that test alphabetical ordering
    const behaviorTypes = [
      { name: 'Zebra Plotting', conspiracy_score: 1, is_custom: true },
      { name: 'Apple Watching', conspiracy_score: 2, is_custom: true },
      { name: 'Midnight Scheming', conspiracy_score: 3, is_custom: false },
      { name: 'Box Infiltration', conspiracy_score: 4, is_custom: true },
      { name: 'Yarn Investigation', conspiracy_score: 5, is_custom: false }
    ];

    await db.insert(behaviorTypesTable).values(behaviorTypes).execute();

    const result = await getBehaviorTypes();

    expect(result).toHaveLength(5);
    
    // Verify alphabetical ordering
    const expectedOrder = [
      'Apple Watching',
      'Box Infiltration', 
      'Midnight Scheming',
      'Yarn Investigation',
      'Zebra Plotting'
    ];
    
    result.forEach((behaviorType, index) => {
      expect(behaviorType.name).toEqual(expectedOrder[index]);
    });
  });
});
