import { describe, expect, it } from 'bun:test';
import { getBreakSuggestions } from '../handlers/get_break_suggestions';

describe('getBreakSuggestions', () => {
  it('should return suggestions for normal work and screen time', async () => {
    const result = await getBreakSuggestions(6.5, 5);

    expect(result.work_hours).toBe(6.5);
    expect(result.screen_time).toBe(5);
    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions).toContain("Good work today! Take short breaks every hour to maintain productivity.");
    expect(result.suggestions).toContain("Good screen time management. Keep taking regular breaks.");
  });

  it('should provide suggestions for high work hours (> 8)', async () => {
    const result = await getBreakSuggestions(9, 4);

    expect(result.work_hours).toBe(9);
    expect(result.screen_time).toBe(4);
    expect(result.suggestions).toContain("You've worked over 8 hours today. Consider taking a longer break to rest and recharge.");
    expect(result.suggestions).toContain("Schedule some downtime this evening to decompress.");
  });

  it('should provide suggestions for excessive work hours (> 10)', async () => {
    const result = await getBreakSuggestions(12, 6);

    expect(result.suggestions).toContain("You've worked over 10 hours today. This is excessive - consider delegating tasks and setting boundaries.");
    expect(result.suggestions).toContain("Take a 15-30 minute break every 2 hours to prevent burnout.");
  });

  it('should provide suggestions for high screen time (> 8)', async () => {
    const result = await getBreakSuggestions(6, 9);

    expect(result.suggestions).toContain("High screen time detected. Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.");
    expect(result.suggestions).toContain("Consider taking a walk or doing some physical activity to rest your eyes.");
  });

  it('should provide suggestions for very high screen time (> 10)', async () => {
    const result = await getBreakSuggestions(5, 11);

    expect(result.suggestions).toContain("Very high screen time detected. Your eyes need immediate rest - take a 20-minute break away from screens.");
    expect(result.suggestions).toContain("Consider using blue light filters and ensure proper lighting in your workspace.");
  });

  it('should provide combined suggestions for high work and screen time', async () => {
    const result = await getBreakSuggestions(9, 10);

    expect(result.suggestions).toContain("Both work and screen time are high. Prioritize getting good sleep tonight and consider meditation.");
    expect(result.suggestions).toContain("Tomorrow, try to incorporate more non-screen work activities if possible.");
  });

  it('should provide suggestions for moderate screen time (6-8 hours)', async () => {
    const result = await getBreakSuggestions(5, 7);

    expect(result.suggestions).toContain("Moderate screen time. Remember to blink frequently and adjust your screen brightness.");
    expect(result.suggestions).toContain("Take regular breaks to stretch and move around.");
  });

  it('should provide suggestions for light day overall', async () => {
    const result = await getBreakSuggestions(1, 1);

    expect(result.suggestions).toContain("Light day overall. This is great for recovery and maintaining balance.");
  });

  it('should provide suggestions when screen time significantly exceeds work time', async () => {
    const result = await getBreakSuggestions(3, 8);

    expect(result.suggestions).toContain("Screen time significantly exceeds work hours. Consider reducing recreational screen time.");
  });

  it('should provide suggestions for light work day', async () => {
    const result = await getBreakSuggestions(5, 4);

    expect(result.suggestions).toContain("Light work day - great for maintaining work-life balance!");
    expect(result.suggestions.length).toBe(1);
  });

  it('should provide default suggestions when no specific conditions are met', async () => {
    const result = await getBreakSuggestions(0, 3);

    expect(result.suggestions).toContain("Great balance today! Keep maintaining healthy work and screen time habits.");
    expect(result.suggestions).toContain("Remember to stay hydrated and take breaks when needed.");
    expect(result.suggestions.length).toBe(2);
  });

  it('should handle zero values correctly', async () => {
    const result = await getBreakSuggestions(0, 0);

    expect(result.work_hours).toBe(0);
    expect(result.screen_time).toBe(0);
    expect(result.suggestions).toContain("Light day overall. This is great for recovery and maintaining balance.");
  });

  it('should handle boundary values (24 hours)', async () => {
    const result = await getBreakSuggestions(24, 24);

    expect(result.work_hours).toBe(24);
    expect(result.screen_time).toBe(24);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions).toContain("You've worked over 10 hours today. This is excessive - consider delegating tasks and setting boundaries.");
  });

  it('should validate work hours range and throw error for negative values', async () => {
    await expect(getBreakSuggestions(-1, 5)).rejects.toThrow(/work hours must be between 0 and 24/i);
  });

  it('should validate work hours range and throw error for values > 24', async () => {
    await expect(getBreakSuggestions(25, 5)).rejects.toThrow(/work hours must be between 0 and 24/i);
  });

  it('should validate screen time range and throw error for negative values', async () => {
    await expect(getBreakSuggestions(5, -1)).rejects.toThrow(/screen time must be between 0 and 24/i);
  });

  it('should validate screen time range and throw error for values > 24', async () => {
    await expect(getBreakSuggestions(5, 25)).rejects.toThrow(/screen time must be between 0 and 24/i);
  });

  it('should handle decimal values correctly', async () => {
    const result = await getBreakSuggestions(7.5, 6.25);

    expect(result.work_hours).toBe(7.5);
    expect(result.screen_time).toBe(6.25);
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.screen_time).toBe('number');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should return proper BreakSuggestion structure', async () => {
    const result = await getBreakSuggestions(6, 5);

    expect(result).toHaveProperty('work_hours');
    expect(result).toHaveProperty('screen_time');
    expect(result).toHaveProperty('suggestions');
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.screen_time).toBe('number');
    
    // All suggestions should be strings
    result.suggestions.forEach(suggestion => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  });
});
