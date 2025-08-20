import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { getWellnessSummary } from '../handlers/get_wellness_summary';

describe('getWellnessSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no entries exist', async () => {
    const result = await getWellnessSummary('weekly');

    expect(result.period).toEqual('weekly');
    expect(result.average_sleep_hours).toEqual(0);
    expect(result.average_work_hours).toEqual(0);
    expect(result.average_social_time_hours).toEqual(0);
    expect(result.average_screen_time_hours).toEqual(0);
    expect(result.average_emotional_energy).toEqual(0);
    expect(result.total_entries).toEqual(0);
    expect(result.break_suggestions).toEqual([]);
  });

  it('should calculate averages correctly for single entry', async () => {
    // Insert a test entry
    const today = new Date().toISOString().split('T')[0];
    await db.insert(wellBeingEntriesTable)
      .values({
        date: today,
        sleep_hours: 8.5,
        work_hours: 9.0,
        social_time_hours: 2.5,
        screen_time_hours: 6.0,
        emotional_energy_level: 7
      })
      .execute();

    const result = await getWellnessSummary('weekly');

    expect(result.period).toEqual('weekly');
    expect(result.average_sleep_hours).toEqual(8.5);
    expect(result.average_work_hours).toEqual(9.0);
    expect(result.average_social_time_hours).toEqual(2.5);
    expect(result.average_screen_time_hours).toEqual(6.0);
    expect(result.average_emotional_energy).toEqual(7);
    expect(result.total_entries).toEqual(1);
    expect(result.break_suggestions.length).toBeGreaterThan(0);
  });

  it('should calculate averages correctly for multiple entries', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Insert multiple test entries
    await db.insert(wellBeingEntriesTable)
      .values([
        {
          date: today.toISOString().split('T')[0],
          sleep_hours: 8.0,
          work_hours: 8.0,
          social_time_hours: 2.0,
          screen_time_hours: 5.0,
          emotional_energy_level: 8
        },
        {
          date: yesterday.toISOString().split('T')[0],
          sleep_hours: 7.0,
          work_hours: 9.0,
          social_time_hours: 1.5,
          screen_time_hours: 7.0,
          emotional_energy_level: 6
        }
      ])
      .execute();

    const result = await getWellnessSummary('weekly');

    expect(result.period).toEqual('weekly');
    expect(result.average_sleep_hours).toEqual(7.5); // (8.0 + 7.0) / 2
    expect(result.average_work_hours).toEqual(8.5);  // (8.0 + 9.0) / 2
    expect(result.average_social_time_hours).toEqual(1.8); // (2.0 + 1.5) / 2, rounded
    expect(result.average_screen_time_hours).toEqual(6.0); // (5.0 + 7.0) / 2
    expect(result.average_emotional_energy).toEqual(7.0);  // (8 + 6) / 2
    expect(result.total_entries).toEqual(2);
  });

  it('should filter entries by daily period correctly', async () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    // Insert entries - one recent, one old
    await db.insert(wellBeingEntriesTable)
      .values([
        {
          date: today.toISOString().split('T')[0],
          sleep_hours: 8.0,
          work_hours: 8.0,
          social_time_hours: 2.0,
          screen_time_hours: 5.0,
          emotional_energy_level: 8
        },
        {
          date: twoDaysAgo.toISOString().split('T')[0],
          sleep_hours: 6.0,
          work_hours: 10.0,
          social_time_hours: 1.0,
          screen_time_hours: 9.0,
          emotional_energy_level: 4
        }
      ])
      .execute();

    const result = await getWellnessSummary('daily');

    // Should only include today's entry (within last 24 hours)
    expect(result.total_entries).toEqual(1);
    expect(result.average_sleep_hours).toEqual(8.0);
    expect(result.average_work_hours).toEqual(8.0);
  });

  it('should filter entries by monthly period correctly', async () => {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setDate(today.getDate() - 60);

    // Insert entries - one recent, one very old
    await db.insert(wellBeingEntriesTable)
      .values([
        {
          date: today.toISOString().split('T')[0],
          sleep_hours: 8.0,
          work_hours: 8.0,
          social_time_hours: 2.0,
          screen_time_hours: 5.0,
          emotional_energy_level: 8
        },
        {
          date: twoMonthsAgo.toISOString().split('T')[0],
          sleep_hours: 6.0,
          work_hours: 10.0,
          social_time_hours: 1.0,
          screen_time_hours: 9.0,
          emotional_energy_level: 4
        }
      ])
      .execute();

    const result = await getWellnessSummary('monthly');

    // Should only include recent entry (within last 30 days)
    expect(result.total_entries).toEqual(1);
    expect(result.average_sleep_hours).toEqual(8.0);
  });

  it('should generate work break suggestions for excessive work hours', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Insert entry with high work hours
    await db.insert(wellBeingEntriesTable)
      .values({
        date: today,
        sleep_hours: 8.0,
        work_hours: 12.0, // Excessive work hours
        social_time_hours: 1.0,
        screen_time_hours: 4.0,
        emotional_energy_level: 5
      })
      .execute();

    const result = await getWellnessSummary('weekly');

    const workBreakSuggestion = result.break_suggestions.find(
      s => s.suggestion_type === 'work_break'
    );
    
    expect(workBreakSuggestion).toBeDefined();
    expect(workBreakSuggestion!.urgency_level).toEqual('high');
    expect(workBreakSuggestion!.message).toMatch(/10 hours/i);
  });

  it('should generate screen break suggestions for excessive screen time', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Insert entry with high screen time
    await db.insert(wellBeingEntriesTable)
      .values({
        date: today,
        sleep_hours: 8.0,
        work_hours: 8.0,
        social_time_hours: 2.0,
        screen_time_hours: 10.0, // Excessive screen time
        emotional_energy_level: 6
      })
      .execute();

    const result = await getWellnessSummary('weekly');

    const screenBreakSuggestion = result.break_suggestions.find(
      s => s.suggestion_type === 'screen_break'
    );
    
    expect(screenBreakSuggestion).toBeDefined();
    expect(screenBreakSuggestion!.urgency_level).toEqual('high');
    expect(screenBreakSuggestion!.recommended_action).toMatch(/20-20-20/i);
  });

  it('should generate wellness suggestions for poor sleep', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Insert entry with poor sleep
    await db.insert(wellBeingEntriesTable)
      .values({
        date: today,
        sleep_hours: 5.0, // Poor sleep
        work_hours: 8.0,
        social_time_hours: 2.0,
        screen_time_hours: 6.0,
        emotional_energy_level: 3 // Low energy due to poor sleep
      })
      .execute();

    const result = await getWellnessSummary('weekly');

    const wellnessSuggestions = result.break_suggestions.filter(
      s => s.suggestion_type === 'general_wellness'
    );
    
    expect(wellnessSuggestions.length).toBeGreaterThan(0);
    
    // Should have sleep-related suggestion
    const sleepSuggestion = wellnessSuggestions.find(
      s => s.message.toLowerCase().includes('sleep')
    );
    expect(sleepSuggestion).toBeDefined();
    expect(sleepSuggestion!.urgency_level).toEqual('high');

    // Should also have energy-related suggestion
    const energySuggestion = wellnessSuggestions.find(
      s => s.message.toLowerCase().includes('energy')
    );
    expect(energySuggestion).toBeDefined();
  });

  it('should generate positive feedback for good wellness metrics', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Insert entry with good metrics
    await db.insert(wellBeingEntriesTable)
      .values({
        date: today,
        sleep_hours: 8.0, // Good sleep
        work_hours: 7.5,  // Reasonable work hours
        social_time_hours: 2.5, // Good social time
        screen_time_hours: 4.0,  // Moderate screen time
        emotional_energy_level: 8 // High energy
      })
      .execute();

    const result = await getWellnessSummary('weekly');

    // Should have at least one positive suggestion
    const positiveSuggestion = result.break_suggestions.find(
      s => s.message.toLowerCase().includes('good') || s.urgency_level === 'low'
    );
    
    expect(positiveSuggestion).toBeDefined();
    expect(positiveSuggestion!.recommended_action).toMatch(/continue/i);
  });

  it('should round averages to one decimal place', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Insert entries that will create decimal averages
    await db.insert(wellBeingEntriesTable)
      .values([
        {
          date: today,
          sleep_hours: 7.33, // Will create 7.33 average
          work_hours: 8.67,
          social_time_hours: 1.89,
          screen_time_hours: 5.11,
          emotional_energy_level: 7
        }
      ])
      .execute();

    const result = await getWellnessSummary('weekly');

    // Check that values are rounded to 1 decimal place
    expect(result.average_sleep_hours).toEqual(7.3);
    expect(result.average_work_hours).toEqual(8.7);
    expect(result.average_social_time_hours).toEqual(1.9);
    expect(result.average_screen_time_hours).toEqual(5.1);
    expect(result.average_emotional_energy).toEqual(7.0);
  });

  it('should use weekly as default period', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    await db.insert(wellBeingEntriesTable)
      .values({
        date: today,
        sleep_hours: 8.0,
        work_hours: 8.0,
        social_time_hours: 2.0,
        screen_time_hours: 5.0,
        emotional_energy_level: 7
      })
      .execute();

    // Call without period parameter
    const result = await getWellnessSummary();

    expect(result.period).toEqual('weekly');
    expect(result.total_entries).toEqual(1);
  });
});
