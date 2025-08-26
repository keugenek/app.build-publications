import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { getBreakSuggestions } from '../handlers/get_break_suggestions';

describe('getBreakSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no metrics exist', async () => {
    const suggestions = await getBreakSuggestions();
    expect(suggestions).toEqual([]);
  });

  it('should provide sleep suggestions for insufficient sleep', async () => {
    // Insert test data with low sleep duration
    await db.insert(dailyMetricsTable).values({
      date: new Date().toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      sleep_duration: '5.00', // Numeric columns require string values
      work_hours: '8.00',
      social_time: '2.00',
      screen_time: '6.00',
      emotional_energy: 7
    }).execute();

    const suggestions = await getBreakSuggestions();
    
    const sleepSuggestion = suggestions.find(s => s.type === 'sleep');
    expect(sleepSuggestion).toBeDefined();
    expect(sleepSuggestion?.message).toContain('insufficient sleep');
    expect(sleepSuggestion?.recommendation).toContain('7-8 hours');
  });

  it('should provide work suggestions for excessive work hours', async () => {
    // Insert test data with high work hours
    await db.insert(dailyMetricsTable).values({
      date: new Date().toISOString().split('T')[0],
      sleep_duration: '7.00',
      work_hours: '12.00', // Excessive work hours
      social_time: '1.00',
      screen_time: '6.00',
      emotional_energy: 5
    }).execute();

    const suggestions = await getBreakSuggestions();
    
    const workSuggestion = suggestions.find(s => s.type === 'work');
    expect(workSuggestion).toBeDefined();
    expect(workSuggestion?.message).toContain('working long hours');
  });

  it('should provide screen time suggestions for excessive usage', async () => {
    // Insert test data with high screen time
    await db.insert(dailyMetricsTable).values({
      date: new Date().toISOString().split('T')[0],
      sleep_duration: '7.00',
      work_hours: '8.00',
      social_time: '2.00',
      screen_time: '10.00', // Excessive screen time
      emotional_energy: 6
    }).execute();

    const suggestions = await getBreakSuggestions();
    
    const screenSuggestion = suggestions.find(s => s.type === 'screen');
    expect(screenSuggestion).toBeDefined();
    expect(screenSuggestion?.message).toContain('excessive time on screens');
  });

  it('should provide social suggestions for low social interaction', async () => {
    // Insert test data with low social time
    await db.insert(dailyMetricsTable).values({
      date: new Date().toISOString().split('T')[0],
      sleep_duration: '7.00',
      work_hours: '8.00',
      social_time: '0.50', // Low social time
      screen_time: '6.00',
      emotional_energy: 4
    }).execute();

    const suggestions = await getBreakSuggestions();
    
    const socialSuggestion = suggestions.find(s => s.type === 'social');
    expect(socialSuggestion).toBeDefined();
    expect(socialSuggestion?.message).toContain('limited social interaction');
  });

  it('should provide energy suggestions for low emotional energy', async () => {
    // Insert multiple days of test data with low energy
    const dates = Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    });

    for (const date of dates) {
      await db.insert(dailyMetricsTable).values({
        date: date,
        sleep_duration: '7.00',
        work_hours: '8.00',
        social_time: '2.00',
        screen_time: '6.00',
        emotional_energy: 3 // Consistently low energy
      }).execute();
    }

    const suggestions = await getBreakSuggestions();
    
    const energySuggestion = suggestions.find(s => s.type === 'energy');
    expect(energySuggestion).toBeDefined();
    expect(energySuggestion?.message).toContain('emotional energy levels are consistently low');
  });

  it('should analyze trends and provide relevant suggestions', async () => {
    // Insert test data showing declining energy
    const today = new Date();
    
    // High energy days
    for (let i = 4; i >= 2; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await db.insert(dailyMetricsTable).values({
        date: date.toISOString().split('T')[0],
        sleep_duration: '7.00',
        work_hours: '8.00',
        social_time: '2.00',
        screen_time: '6.00',
        emotional_energy: 8 // High energy
      }).execute();
    }
    
    // Recent low energy days
    for (let i = 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await db.insert(dailyMetricsTable).values({
        date: date.toISOString().split('T')[0],
        sleep_duration: '7.00',
        work_hours: '8.00',
        social_time: '2.00',
        screen_time: '6.00',
        emotional_energy: 2 // Low energy
      }).execute();
    }

    const suggestions = await getBreakSuggestions();
    
    const energySuggestion = suggestions.find(s => s.type === 'energy');
    expect(energySuggestion).toBeDefined();
    expect(energySuggestion?.message).toContain('energy is declining');
  });
});
