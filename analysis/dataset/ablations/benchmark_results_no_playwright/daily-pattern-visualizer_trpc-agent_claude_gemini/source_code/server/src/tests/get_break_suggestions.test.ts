import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { getBreakSuggestions } from '../handlers/get_break_suggestions';

describe('getBreakSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default suggestions when no activity logs exist', async () => {
    const suggestions = await getBreakSuggestions('user123');

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].user_id).toEqual('user123');
    expect(suggestions[0].suggested_time).toEqual('10:30 AM');
    expect(suggestions[0].activity_type).toEqual('short_break');
    expect(suggestions[0].confidence).toEqual(0.7);
    
    // Verify all suggestions have required fields
    suggestions.forEach(suggestion => {
      expect(suggestion.user_id).toEqual('user123');
      expect(suggestion.suggested_time).toBeDefined();
      expect(suggestion.activity_type).toMatch(/^(short_break|long_break|social_time|exercise)$/);
      expect(suggestion.reason).toBeDefined();
      expect(suggestion.confidence).toBeGreaterThan(0);
      expect(suggestion.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should generate suggestions based on high work hours', async () => {
    // Create activity logs with high work hours
    const testLogs = [
      {
        user_id: 'user123',
        date: '2024-01-15',
        sleep_hours: '7.5',
        work_hours: '10.0', // High work hours
        social_hours: '2.0',
        screen_hours: '8.0',
        emotional_energy: 6,
        notes: 'Busy day'
      },
      {
        user_id: 'user123',
        date: '2024-01-14',
        sleep_hours: '8.0',
        work_hours: '9.5', // High work hours
        social_hours: '1.5',
        screen_hours: '9.0',
        emotional_energy: 5,
        notes: 'Long work session'
      }
    ];

    for (const log of testLogs) {
      await db.insert(activityLogsTable).values(log).execute();
    }

    const suggestions = await getBreakSuggestions('user123');

    expect(suggestions.length).toBeGreaterThan(0);
    
    // Should include morning break suggestion due to high work hours
    const morningBreak = suggestions.find(s => s.suggested_time === '10:30 AM');
    expect(morningBreak).toBeDefined();
    expect(morningBreak?.activity_type).toEqual('short_break');
    expect(morningBreak?.confidence).toBeGreaterThan(0.6);

    // Should include late afternoon break for high work hours
    const lateAfternoonBreak = suggestions.find(s => s.suggested_time === '4:00 PM');
    expect(lateAfternoonBreak).toBeDefined();
    expect(lateAfternoonBreak?.reason).toContain('Extended work days');
  });

  it('should suggest exercise for low energy levels', async () => {
    // Create activity logs with low energy levels
    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: '6.0',
      work_hours: '8.0',
      social_hours: '1.0',
      screen_hours: '6.0',
      emotional_energy: 4, // Low energy
      notes: 'Feeling tired'
    }).execute();

    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: '2024-01-14',
      sleep_hours: '5.5',
      work_hours: '7.5',
      social_hours: '1.5',
      screen_hours: '7.0',
      emotional_energy: 3, // Low energy
      notes: 'Low energy day'
    }).execute();

    const suggestions = await getBreakSuggestions('user123');

    // Should suggest exercise for afternoon energy boost
    const exerciseSuggestion = suggestions.find(s => s.activity_type === 'exercise');
    expect(exerciseSuggestion).toBeDefined();
    expect(exerciseSuggestion?.suggested_time).toEqual('2:30 PM');
    expect(exerciseSuggestion?.reason).toContain('Physical activity can boost afternoon energy');
    expect(exerciseSuggestion?.confidence).toBeGreaterThan(0.5);
  });

  it('should suggest long breaks for high screen time', async () => {
    // Create activity logs with high screen time
    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: '7.0',
      work_hours: '8.0',
      social_hours: '2.0',
      screen_hours: '12.0', // Very high screen time
      emotional_energy: 6,
      notes: 'Screen heavy day'
    }).execute();

    const suggestions = await getBreakSuggestions('user123');

    // Should suggest long break during lunch for screen time relief
    const screenBreak = suggestions.find(s => s.suggested_time === '12:00 PM' && s.activity_type === 'long_break');
    expect(screenBreak).toBeDefined();
    expect(screenBreak?.reason).toContain('High screen time');
    expect(screenBreak?.confidence).toBeGreaterThan(0.8);
  });

  it('should suggest social time for low social activity', async () => {
    // Create activity logs with very low social hours
    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: '7.0',
      work_hours: '8.0',
      social_hours: '0.5', // Very low social time
      screen_hours: '6.0',
      emotional_energy: 7,
      notes: 'Isolated day'
    }).execute();

    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: '2024-01-14',
      sleep_hours: '7.5',
      work_hours: '7.0',
      social_hours: '1.0', // Low social time
      screen_hours: '5.0',
      emotional_energy: 6,
      notes: 'Not much social interaction'
    }).execute();

    const suggestions = await getBreakSuggestions('user123');

    // Should suggest social time in evening
    const socialSuggestion = suggestions.find(s => s.activity_type === 'social_time');
    expect(socialSuggestion).toBeDefined();
    expect(socialSuggestion?.suggested_time).toEqual('5:30 PM');
    expect(socialSuggestion?.reason).toContain('social activity is low');
    expect(socialSuggestion?.confidence).toBeGreaterThan(0.6);
  });

  it('should return suggestions sorted by confidence', async () => {
    // Create activity data that will generate multiple suggestions
    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: '6.0',
      work_hours: '12.0', // Very high work hours - high confidence suggestion
      social_hours: '0.5', // Very low social - high confidence suggestion  
      screen_hours: '10.0', // High screen time
      emotional_energy: 3, // Low energy
      notes: 'Intense work day'
    }).execute();

    const suggestions = await getBreakSuggestions('user123');

    expect(suggestions.length).toBeGreaterThan(1);
    
    // Verify suggestions are sorted by confidence (descending)
    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i].confidence).toBeGreaterThanOrEqual(suggestions[i + 1].confidence);
    }

    // Should limit to maximum 4 suggestions
    expect(suggestions.length).toBeLessThanOrEqual(4);
  });

  it('should handle different users independently', async () => {
    // Create data for user1
    await db.insert(activityLogsTable).values({
      user_id: 'user1',
      date: '2024-01-15',
      sleep_hours: '8.0',
      work_hours: '4.0', // Low work hours
      social_hours: '6.0', // High social hours
      screen_hours: '2.0', // Low screen time
      emotional_energy: 9, // High energy
      notes: 'Relaxed day'
    }).execute();

    // Create data for user2  
    await db.insert(activityLogsTable).values({
      user_id: 'user2',
      date: '2024-01-15',
      sleep_hours: '5.0',
      work_hours: '12.0', // High work hours
      social_hours: '0.5', // Low social hours
      screen_hours: '10.0', // High screen time
      emotional_energy: 3, // Low energy
      notes: 'Stressful day'
    }).execute();

    const suggestions1 = await getBreakSuggestions('user1');
    const suggestions2 = await getBreakSuggestions('user2');

    // User1 should have fewer/different suggestions due to healthier patterns
    expect(suggestions1).not.toEqual(suggestions2);
    
    // User2 should have more suggestions due to concerning patterns
    expect(suggestions2.length).toBeGreaterThanOrEqual(suggestions1.length);

    // Verify user_id is correct in all suggestions
    suggestions1.forEach(s => expect(s.user_id).toEqual('user1'));
    suggestions2.forEach(s => expect(s.user_id).toEqual('user2'));
  });

  it('should use recent data for analysis', async () => {
    const today = new Date();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45); // 45 days ago (outside 30-day window)

    // Create old activity log
    await db.insert(activityLogsTable).values({
      user_id: 'user123',
      date: oldDate.toISOString().split('T')[0],
      sleep_hours: '12.0', // Extreme value that shouldn't affect suggestions
      work_hours: '16.0',
      social_hours: '8.0',
      screen_hours: '15.0',
      emotional_energy: 1,
      notes: 'Old extreme data'
    }).execute();

    // Create recent activity log with normal values
    await db.insert(activityLogsTable).values({
      user_id: 'user123', 
      date: today.toISOString().split('T')[0],
      sleep_hours: '7.0',
      work_hours: '8.0',
      social_hours: '3.0',
      screen_hours: '5.0',
      emotional_energy: 7,
      notes: 'Normal recent day'
    }).execute();

    const suggestions = await getBreakSuggestions('user123');

    // Should be based on recent normal data, not extreme old data
    // If old data was used, we'd see extreme suggestions
    const hasExtremeWorkSuggestion = suggestions.some(s => 
      s.reason.includes('16.0') || s.confidence > 0.95
    );
    expect(hasExtremeWorkSuggestion).toBe(false);
  });
});
