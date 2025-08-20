import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { getBreakSuggestions } from '../handlers/get_break_suggestions';

// Helper function to create well-being entries
const createWellBeingEntry = async (data: {
  date: string;
  sleep_hours: number;
  work_hours: number;
  social_time_hours: number;
  screen_time_hours: number;
  emotional_energy_level: number;
}) => {
  const result = await db.insert(wellBeingEntriesTable)
    .values(data)
    .returning()
    .execute();
  return result[0];
};

describe('getBreakSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should provide welcome message when no recent entries exist', async () => {
    const suggestions = await getBreakSuggestions();

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestion_type).toEqual('general_wellness');
    expect(suggestions[0].message).toContain('Welcome to your wellness tracker');
    expect(suggestions[0].urgency_level).toEqual('low');
    expect(suggestions[0].recommended_action).toContain('Log your first well-being entry');
  });

  it('should generate high urgency work break suggestion for excessive work hours', async () => {
    // Create entries with consistently high work hours (over 10 hours)
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 7,
        work_hours: 12, // High work hours
        social_time_hours: 2,
        screen_time_hours: 8,
        emotional_energy_level: 5
      });
    }

    const suggestions = await getBreakSuggestions();

    const workBreakSuggestion = suggestions.find(s => s.suggestion_type === 'work_break');
    expect(workBreakSuggestion).toBeDefined();
    expect(workBreakSuggestion!.urgency_level).toEqual('high');
    expect(workBreakSuggestion!.message).toContain('10 hours daily');
    expect(workBreakSuggestion!.recommended_action).toContain('30-minute walk');
  });

  it('should generate screen break suggestion for high screen time', async () => {
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 8,
        work_hours: 8,
        social_time_hours: 2,
        screen_time_hours: 10, // High screen time
        emotional_energy_level: 6
      });
    }

    const suggestions = await getBreakSuggestions();

    const screenBreakSuggestion = suggestions.find(s => s.suggestion_type === 'screen_break');
    expect(screenBreakSuggestion).toBeDefined();
    expect(screenBreakSuggestion!.urgency_level).toEqual('high');
    expect(screenBreakSuggestion!.message).toContain('screen time is quite high');
    expect(screenBreakSuggestion!.recommended_action).toContain('20-20-20 rule');
  });

  it('should generate wellness suggestion for low energy levels', async () => {
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 7,
        work_hours: 8,
        social_time_hours: 2,
        screen_time_hours: 6,
        emotional_energy_level: 3 // Low energy
      });
    }

    const suggestions = await getBreakSuggestions();

    const wellnessSuggestion = suggestions.find(s => s.suggestion_type === 'general_wellness');
    expect(wellnessSuggestion).toBeDefined();
    expect(wellnessSuggestion!.urgency_level).toEqual('high');
    expect(wellnessSuggestion!.message).toContain('energy levels have been consistently low');
    expect(wellnessSuggestion!.recommended_action).toContain('7-9 hours of sleep');
  });

  it('should generate wellness suggestion for insufficient sleep', async () => {
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 5, // Low sleep
        work_hours: 8,
        social_time_hours: 2,
        screen_time_hours: 6,
        emotional_energy_level: 6
      });
    }

    const suggestions = await getBreakSuggestions();

    const wellnessSuggestion = suggestions.find(s => s.suggestion_type === 'general_wellness');
    expect(wellnessSuggestion).toBeDefined();
    expect(wellnessSuggestion!.message).toContain('not getting enough sleep');
    expect(wellnessSuggestion!.urgency_level).toEqual('high');
    expect(wellnessSuggestion!.recommended_action).toContain('7-9 hours of sleep');
  });

  it('should generate social time suggestion for low social interaction', async () => {
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 8,
        work_hours: 8,
        social_time_hours: 0.5, // Low social time
        screen_time_hours: 6,
        emotional_energy_level: 7
      });
    }

    const suggestions = await getBreakSuggestions();

    const wellnessSuggestion = suggestions.find(s => s.suggestion_type === 'general_wellness');
    expect(wellnessSuggestion).toBeDefined();
    expect(wellnessSuggestion!.message).toContain('social interaction time is quite low');
    expect(wellnessSuggestion!.urgency_level).toEqual('medium');
    expect(wellnessSuggestion!.recommended_action).toContain('Schedule time with friends');
  });

  it('should provide positive feedback for balanced metrics', async () => {
    // Create entries with balanced, healthy metrics
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 8,
        work_hours: 8,
        social_time_hours: 2,
        screen_time_hours: 5,
        emotional_energy_level: 8
      });
    }

    const suggestions = await getBreakSuggestions();

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestion_type).toEqual('general_wellness');
    expect(suggestions[0].message).toContain('metrics look balanced');
    expect(suggestions[0].urgency_level).toEqual('low');
    expect(suggestions[0].recommended_action).toContain('Continue maintaining');
  });

  it('should prioritize suggestions by urgency level', async () => {
    const today = new Date();
    
    // Create entries that will trigger multiple suggestions with different urgency levels
    await createWellBeingEntry({
      date: today.toISOString().split('T')[0],
      sleep_hours: 5, // Will trigger high urgency sleep suggestion
      work_hours: 9, // Will trigger medium urgency work suggestion
      social_time_hours: 0.5, // Will trigger medium urgency social suggestion
      screen_time_hours: 7, // Will trigger medium urgency screen suggestion
      emotional_energy_level: 5 // Moderate energy
    });

    // Add more entries to establish patterns
    for (let i = 1; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 5.5,
        work_hours: 8.5,
        social_time_hours: 0.8,
        screen_time_hours: 6.5,
        emotional_energy_level: 5
      });
    }

    const suggestions = await getBreakSuggestions();

    // Should limit to top 3 suggestions
    expect(suggestions.length).toBeLessThanOrEqual(3);

    // First suggestion should be high urgency (sleep)
    expect(suggestions[0].urgency_level).toEqual('high');
    expect(suggestions[0].suggestion_type).toEqual('general_wellness');
    expect(suggestions[0].message).toContain('sleep');

    // Verify urgency ordering (high comes before medium/low)
    for (let i = 1; i < suggestions.length; i++) {
      const currentUrgency = suggestions[i].urgency_level;
      const previousUrgency = suggestions[i - 1].urgency_level;
      
      const urgencyRank = { 'high': 3, 'medium': 2, 'low': 1 };
      expect(urgencyRank[currentUrgency]).toBeLessThanOrEqual(urgencyRank[previousUrgency]);
    }
  });

  it('should analyze data from last 7 days only', async () => {
    const today = new Date();
    
    // Create old entry (10 days ago) with concerning metrics
    const oldDate = new Date(today);
    oldDate.setDate(oldDate.getDate() - 10);
    await createWellBeingEntry({
      date: oldDate.toISOString().split('T')[0],
      sleep_hours: 4, // Very low sleep
      work_hours: 15, // Very high work
      social_time_hours: 0,
      screen_time_hours: 12,
      emotional_energy_level: 2
    });

    // Create recent entry with good metrics
    await createWellBeingEntry({
      date: today.toISOString().split('T')[0],
      sleep_hours: 8,
      work_hours: 7,
      social_time_hours: 3,
      screen_time_hours: 5,
      emotional_energy_level: 8
    });

    const suggestions = await getBreakSuggestions();

    // Should provide positive feedback based on recent data only
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].message).toContain('metrics look balanced');
  });

  it('should handle medium urgency suggestions correctly', async () => {
    const today = new Date();
    
    // Create today's entry with moderately concerning work hours
    await createWellBeingEntry({
      date: today.toISOString().split('T')[0],
      sleep_hours: 7,
      work_hours: 9, // Slightly high for today
      social_time_hours: 2,
      screen_time_hours: 6,
      emotional_energy_level: 6
    });

    // Add balanced entries for other days
    for (let i = 1; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await createWellBeingEntry({
        date: date.toISOString().split('T')[0],
        sleep_hours: 8,
        work_hours: 7.5,
        social_time_hours: 2,
        screen_time_hours: 5,
        emotional_energy_level: 7
      });
    }

    const suggestions = await getBreakSuggestions();

    const workBreakSuggestion = suggestions.find(s => s.suggestion_type === 'work_break');
    expect(workBreakSuggestion).toBeDefined();
    expect(workBreakSuggestion!.urgency_level).toEqual('medium');
    expect(workBreakSuggestion!.message).toContain('worked more than 8 hours today');
    expect(workBreakSuggestion!.recommended_action).toContain('15 minutes');
  });
});
