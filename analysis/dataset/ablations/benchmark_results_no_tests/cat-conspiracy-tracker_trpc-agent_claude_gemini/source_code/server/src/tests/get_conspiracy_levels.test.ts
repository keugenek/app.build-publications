import { describe, expect, it } from 'bun:test';
import { calculateConspiracyLevel, CONSPIRACY_LEVELS, type ConspiracyLevelInfo } from '../handlers/get_conspiracy_levels';

describe('calculateConspiracyLevel', () => {
  it('should return innocent level for 0 points', () => {
    const result = calculateConspiracyLevel(0);
    
    expect(result.level).toBe('innocent');
    expect(result.minPoints).toBe(0);
    expect(result.maxPoints).toBe(20);
    expect(result.description).toContain('behaving normally');
  });

  it('should return innocent level for points within innocent range', () => {
    const result = calculateConspiracyLevel(15);
    
    expect(result.level).toBe('innocent');
    expect(result.minPoints).toBe(0);
    expect(result.maxPoints).toBe(20);
  });

  it('should return innocent level for maximum innocent points', () => {
    const result = calculateConspiracyLevel(20);
    
    expect(result.level).toBe('innocent');
  });

  it('should return suspicious level for minimum suspicious points', () => {
    const result = calculateConspiracyLevel(21);
    
    expect(result.level).toBe('suspicious');
    expect(result.minPoints).toBe(21);
    expect(result.maxPoints).toBe(50);
    expect(result.description).toContain('questionable activities');
  });

  it('should return suspicious level for points within suspicious range', () => {
    const result = calculateConspiracyLevel(35);
    
    expect(result.level).toBe('suspicious');
  });

  it('should return suspicious level for maximum suspicious points', () => {
    const result = calculateConspiracyLevel(50);
    
    expect(result.level).toBe('suspicious');
  });

  it('should return plotting level for minimum plotting points', () => {
    const result = calculateConspiracyLevel(51);
    
    expect(result.level).toBe('plotting');
    expect(result.minPoints).toBe(51);
    expect(result.maxPoints).toBe(100);
    expect(result.description).toContain('planning something significant');
  });

  it('should return plotting level for points within plotting range', () => {
    const result = calculateConspiracyLevel(75);
    
    expect(result.level).toBe('plotting');
  });

  it('should return plotting level for maximum plotting points', () => {
    const result = calculateConspiracyLevel(100);
    
    expect(result.level).toBe('plotting');
  });

  it('should return dangerous level for minimum dangerous points', () => {
    const result = calculateConspiracyLevel(101);
    
    expect(result.level).toBe('dangerous');
    expect(result.minPoints).toBe(101);
    expect(result.maxPoints).toBe(150);
    expect(result.description).toContain('High alert');
  });

  it('should return dangerous level for points within dangerous range', () => {
    const result = calculateConspiracyLevel(125);
    
    expect(result.level).toBe('dangerous');
  });

  it('should return dangerous level for maximum dangerous points', () => {
    const result = calculateConspiracyLevel(150);
    
    expect(result.level).toBe('dangerous');
  });

  it('should return world_domination level for minimum world_domination points', () => {
    const result = calculateConspiracyLevel(151);
    
    expect(result.level).toBe('world_domination');
    expect(result.minPoints).toBe(151);
    expect(result.maxPoints).toBe(Infinity);
    expect(result.description).toContain('MAXIMUM THREAT LEVEL');
  });

  it('should return world_domination level for very high points', () => {
    const result = calculateConspiracyLevel(500);
    
    expect(result.level).toBe('world_domination');
  });

  it('should return world_domination level for extremely high points', () => {
    const result = calculateConspiracyLevel(99999);
    
    expect(result.level).toBe('world_domination');
  });

  it('should handle negative points by treating as 0 (innocent)', () => {
    const result = calculateConspiracyLevel(-10);
    
    expect(result.level).toBe('innocent');
    expect(result.minPoints).toBe(0);
    expect(result.maxPoints).toBe(20);
  });

  it('should handle edge case of very large negative points', () => {
    const result = calculateConspiracyLevel(-99999);
    
    expect(result.level).toBe('innocent');
  });

  it('should return proper object structure with all required fields', () => {
    const result = calculateConspiracyLevel(75);
    
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('minPoints');
    expect(result).toHaveProperty('maxPoints');
    expect(result).toHaveProperty('description');
    
    expect(typeof result.level).toBe('string');
    expect(typeof result.minPoints).toBe('number');
    expect(typeof result.maxPoints).toBe('number');
    expect(typeof result.description).toBe('string');
  });

  it('should test boundary conditions for all levels', () => {
    // Test all boundary points
    const boundaries: Array<{ points: number; expectedLevel: 'innocent' | 'suspicious' | 'plotting' | 'dangerous' | 'world_domination' }> = [
      { points: 0, expectedLevel: 'innocent' },
      { points: 20, expectedLevel: 'innocent' },
      { points: 21, expectedLevel: 'suspicious' },
      { points: 50, expectedLevel: 'suspicious' },
      { points: 51, expectedLevel: 'plotting' },
      { points: 100, expectedLevel: 'plotting' },
      { points: 101, expectedLevel: 'dangerous' },
      { points: 150, expectedLevel: 'dangerous' },
      { points: 151, expectedLevel: 'world_domination' },
    ];

    boundaries.forEach(({ points, expectedLevel }) => {
      const result = calculateConspiracyLevel(points);
      expect(result.level).toBe(expectedLevel);
    });
  });
});

describe('CONSPIRACY_LEVELS constant', () => {
  it('should have 5 conspiracy levels', () => {
    expect(CONSPIRACY_LEVELS).toHaveLength(5);
  });

  it('should have correct level names in order', () => {
    const levels = CONSPIRACY_LEVELS.map(level => level.level);
    expect(levels).toEqual([
      'innocent',
      'suspicious',
      'plotting',
      'dangerous',
      'world_domination'
    ]);
  });

  it('should have non-overlapping point ranges', () => {
    for (let i = 0; i < CONSPIRACY_LEVELS.length - 1; i++) {
      const current = CONSPIRACY_LEVELS[i];
      const next = CONSPIRACY_LEVELS[i + 1];
      
      // Current max should be one less than next min
      expect(current.maxPoints + 1).toBe(next.minPoints);
    }
  });

  it('should have all required properties for each level', () => {
    CONSPIRACY_LEVELS.forEach(level => {
      expect(level).toHaveProperty('level');
      expect(level).toHaveProperty('minPoints');
      expect(level).toHaveProperty('maxPoints');
      expect(level).toHaveProperty('description');
      
      expect(typeof level.level).toBe('string');
      expect(typeof level.minPoints).toBe('number');
      expect(typeof level.maxPoints).toBe('number');
      expect(typeof level.description).toBe('string');
      
      expect(level.minPoints).toBeGreaterThanOrEqual(0);
      expect(level.maxPoints).toBeGreaterThanOrEqual(level.minPoints);
      expect(level.description.length).toBeGreaterThan(0);
    });
  });

  it('should start with 0 points for innocent level', () => {
    expect(CONSPIRACY_LEVELS[0].minPoints).toBe(0);
  });

  it('should end with Infinity for world_domination level', () => {
    const lastLevel = CONSPIRACY_LEVELS[CONSPIRACY_LEVELS.length - 1];
    expect(lastLevel.maxPoints).toBe(Infinity);
    expect(lastLevel.level).toBe('world_domination');
  });
});
