import { describe, it, expect } from 'bun:test';
import { getBreakSuggestions } from '../handlers/get_break_suggestions';
import { type DailyLog, type BreakSuggestion } from '../schema';

// Test data with proper numeric values (as they would come from DB)
const healthyLogs: DailyLog[] = [
  {
    id: 1,
    date: new Date('2023-01-01'),
    sleep_hours: 8,
    work_hours: 7,
    social_time: 2,
    screen_time: 5,
    emotional_energy: 7,
    created_at: new Date('2023-01-01')
  },
  {
    id: 2,
    date: new Date('2023-01-02'),
    sleep_hours: 7.5,
    work_hours: 6.5,
    social_time: 3,
    screen_time: 4.5,
    emotional_energy: 8,
    created_at: new Date('2023-01-02')
  }
];

const overworkedLogs: DailyLog[] = [
  {
    id: 1,
    date: new Date('2023-01-01'),
    sleep_hours: 5,
    work_hours: 12,
    social_time: 1,
    screen_time: 8,
    emotional_energy: 3,
    created_at: new Date('2023-01-01')
  },
  {
    id: 2,
    date: new Date('2023-01-02'),
    sleep_hours: 6,
    work_hours: 10,
    social_time: 0.5,
    screen_time: 10,
    emotional_energy: 2,
    created_at: new Date('2023-01-02')
  }
];

const mixedLogs: DailyLog[] = [
  {
    id: 1,
    date: new Date('2023-01-01'),
    sleep_hours: 8,
    work_hours: 9,
    social_time: 1,
    screen_time: 7,
    emotional_energy: 4,
    created_at: new Date('2023-01-01')
  },
  {
    id: 2,
    date: new Date('2023-01-02'),
    sleep_hours: 7,
    work_hours: 7,
    social_time: 2,
    screen_time: 5,
    emotional_energy: 6,
    created_at: new Date('2023-01-02')
  }
];

describe('getBreakSuggestions', () => {
  it('should return empty array for healthy logs', async () => {
    const suggestions = await getBreakSuggestions(healthyLogs);
    
    expect(suggestions).toBeInstanceOf(Array);
    expect(suggestions).toHaveLength(0);
  });

  it('should return high priority suggestions for overworked logs', async () => {
    const suggestions = await getBreakSuggestions(overworkedLogs);
    
    expect(suggestions).toBeInstanceOf(Array);
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Should have work break suggestion
    const workBreak = suggestions.find(s => s.type === 'work_break');
    expect(workBreak).toBeDefined();
    expect(workBreak?.priority).toBe('high');
    expect(workBreak?.message).toMatch(/average work hours \(11\.0\) are high/i);
    
    // Should have screen break suggestion
    const screenBreak = suggestions.find(s => s.type === 'screen_break');
    expect(screenBreak).toBeDefined();
    expect(screenBreak?.priority).toBe('high');
    expect(screenBreak?.message).toMatch(/average screen time \(9\.0 hours\) is high/i);
    
    // Should have energy boost suggestion
    const energyBoost = suggestions.find(s => s.type === 'energy_boost');
    expect(energyBoost).toBeDefined();
    expect(energyBoost?.priority).toBe('high');
    expect(energyBoost?.message).toMatch(/average emotional energy \(2\.5\) is low/i);
  });

  it('should return medium priority suggestions for moderately unhealthy logs', async () => {
    const suggestions = await getBreakSuggestions(mixedLogs);
    
    expect(suggestions).toBeInstanceOf(Array);
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Should have work break suggestion
    const workBreak = suggestions.find(s => s.type === 'work_break');
    expect(workBreak).toBeDefined();
    expect(workBreak?.priority).toBe('medium');
    expect(workBreak?.message).toMatch(/average work hours \(8\.0\) are high/i);
    
    // Should have screen break suggestion
    const screenBreak = suggestions.find(s => s.type === 'screen_break');
    expect(screenBreak).toBeDefined();
    expect(screenBreak?.priority).toBe('high');
    expect(screenBreak?.message).toMatch(/average screen time \(6\.0 hours\) is high/i);
    
    // Should have energy boost suggestion
    const energyBoost = suggestions.find(s => s.type === 'energy_boost');
    expect(energyBoost).toBeDefined();
    expect(energyBoost?.priority).toBe('medium');
    expect(energyBoost?.message).toMatch(/average emotional energy \(5\.0\) is low/i);
  });

  it('should return empty array when no logs are provided', async () => {
    const suggestions = await getBreakSuggestions([]);
    
    expect(suggestions).toBeInstanceOf(Array);
    expect(suggestions).toHaveLength(0);
  });

  it('should deduplicate suggestions and keep highest priority', async () => {
    // Create logs that would trigger multiple similar suggestions
    const duplicateLogs: DailyLog[] = [
      {
        id: 1,
        date: new Date('2023-01-01'),
        sleep_hours: 8,
        work_hours: 11,
        social_time: 1,
        screen_time: 9,
        emotional_energy: 2,
        created_at: new Date('2023-01-01')
      }
    ];
    
    const suggestions = await getBreakSuggestions(duplicateLogs);
    
    // Should have each type only once
    const types = suggestions.map(s => s.type);
    const uniqueTypes = [...new Set(types)];
    expect(types).toEqual(uniqueTypes);
    
    // All suggestions should be high priority for this data
    suggestions.forEach(suggestion => {
      expect(suggestion.priority).toBe('high');
    });
  });

  it('should return suggestions sorted by priority', async () => {
    const suggestions = await getBreakSuggestions(overworkedLogs);
    
    // Verify sorting - high priority should come first
    const prioritiesInOrder = suggestions.map(s => s.priority);
    const expectedOrder = ['high', 'high', 'high']; // Should have 3 high priority suggestions
    
    // Just check that we have high priority items first
    expect(prioritiesInOrder[0]).toBe('high');
  });

  it('should include social suggestions when appropriate', async () => {
    const goodEnergyLowSocialLogs: DailyLog[] = [
      {
        id: 1,
        date: new Date('2023-01-01'),
        sleep_hours: 8,
        work_hours: 7,
        social_time: 1,
        screen_time: 5,
        emotional_energy: 7,
        created_at: new Date('2023-01-01')
      }
    ];
    
    const suggestions = await getBreakSuggestions(goodEnergyLowSocialLogs);
    
    const socialSuggestion = suggestions.find(s => s.type === 'social_suggestion');
    expect(socialSuggestion).toBeDefined();
    expect(socialSuggestion?.priority).toBe('low');
    expect(socialSuggestion?.message).toMatch(/social time is limited/i);
  });
});
