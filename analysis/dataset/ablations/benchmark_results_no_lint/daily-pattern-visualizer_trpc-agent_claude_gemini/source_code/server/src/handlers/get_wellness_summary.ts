import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type WellnessSummary, type BreakSuggestion } from '../schema';
import { gte, sql } from 'drizzle-orm';

export async function getWellnessSummary(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<WellnessSummary> {
  try {
    // Calculate the start date based on the period
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // Query entries within the specified period
    const entries = await db.select()
      .from(wellBeingEntriesTable)
      .where(gte(wellBeingEntriesTable.date, startDate.toISOString().split('T')[0]))
      .execute();

    // If no entries, return default values
    if (entries.length === 0) {
      return {
        period,
        average_sleep_hours: 0,
        average_work_hours: 0,
        average_social_time_hours: 0,
        average_screen_time_hours: 0,
        average_emotional_energy: 0,
        total_entries: 0,
        break_suggestions: []
      };
    }

    // Calculate averages - convert numeric fields from database strings
    const averages = entries.reduce((acc, entry) => {
      acc.sleep_hours += entry.sleep_hours;
      acc.work_hours += entry.work_hours;
      acc.social_time_hours += entry.social_time_hours;
      acc.screen_time_hours += entry.screen_time_hours;
      acc.emotional_energy_level += entry.emotional_energy_level;
      return acc;
    }, {
      sleep_hours: 0,
      work_hours: 0,
      social_time_hours: 0,
      screen_time_hours: 0,
      emotional_energy_level: 0
    });

    const entryCount = entries.length;
    const avgSleep = averages.sleep_hours / entryCount;
    const avgWork = averages.work_hours / entryCount;
    const avgSocial = averages.social_time_hours / entryCount;
    const avgScreen = averages.screen_time_hours / entryCount;
    const avgEnergy = averages.emotional_energy_level / entryCount;

    // Generate break suggestions based on patterns
    const breakSuggestions = generateBreakSuggestions({
      avgWork,
      avgScreen,
      avgSleep,
      avgEnergy,
      avgSocial
    });

    return {
      period,
      average_sleep_hours: Math.round(avgSleep * 10) / 10, // Round to 1 decimal
      average_work_hours: Math.round(avgWork * 10) / 10,
      average_social_time_hours: Math.round(avgSocial * 10) / 10,
      average_screen_time_hours: Math.round(avgScreen * 10) / 10,
      average_emotional_energy: Math.round(avgEnergy * 10) / 10,
      total_entries: entryCount,
      break_suggestions: breakSuggestions
    };
  } catch (error) {
    console.error('Wellness summary calculation failed:', error);
    throw error;
  }
}

// Helper function to generate intelligent break suggestions
function generateBreakSuggestions(metrics: {
  avgWork: number;
  avgScreen: number;
  avgSleep: number;
  avgEnergy: number;
  avgSocial: number;
}): BreakSuggestion[] {
  const suggestions: BreakSuggestion[] = [];

  // Work break suggestions
  if (metrics.avgWork > 10) {
    suggestions.push({
      suggestion_type: 'work_break',
      message: 'You are working over 10 hours daily. Consider reducing work hours for better work-life balance.',
      urgency_level: 'high',
      recommended_action: 'Schedule specific end times for work and stick to them'
    });
  } else if (metrics.avgWork > 8) {
    suggestions.push({
      suggestion_type: 'work_break',
      message: 'Long work hours detected. Regular breaks can improve productivity and well-being.',
      urgency_level: 'medium',
      recommended_action: 'Take a 15-minute break every 2 hours during work'
    });
  }

  // Screen time suggestions
  if (metrics.avgScreen > 8) {
    suggestions.push({
      suggestion_type: 'screen_break',
      message: 'Your screen time is significantly above recommended levels.',
      urgency_level: 'high',
      recommended_action: 'Follow the 20-20-20 rule and consider digital detox periods'
    });
  } else if (metrics.avgScreen > 6) {
    suggestions.push({
      suggestion_type: 'screen_break',
      message: 'Consider reducing screen time to protect your eyes and mental health.',
      urgency_level: 'medium',
      recommended_action: 'Take screen breaks every 30 minutes and avoid screens 1 hour before bed'
    });
  }

  // General wellness suggestions
  if (metrics.avgSleep < 6) {
    suggestions.push({
      suggestion_type: 'general_wellness',
      message: 'You are getting insufficient sleep. This affects your energy and overall health.',
      urgency_level: 'high',
      recommended_action: 'Aim for 7-9 hours of sleep per night and establish a consistent bedtime routine'
    });
  } else if (metrics.avgSleep < 7) {
    suggestions.push({
      suggestion_type: 'general_wellness',
      message: 'Your sleep could be improved for better energy levels.',
      urgency_level: 'medium',
      recommended_action: 'Try to get at least 7 hours of sleep and maintain consistent sleep schedule'
    });
  }

  if (metrics.avgEnergy < 4) {
    suggestions.push({
      suggestion_type: 'general_wellness',
      message: 'Your emotional energy levels are consistently low.',
      urgency_level: 'high',
      recommended_action: 'Consider stress management techniques, exercise, or speaking with a healthcare provider'
    });
  } else if (metrics.avgEnergy < 6) {
    suggestions.push({
      suggestion_type: 'general_wellness',
      message: 'Your energy levels could be improved with lifestyle adjustments.',
      urgency_level: 'medium',
      recommended_action: 'Focus on regular exercise, balanced nutrition, and adequate rest'
    });
  }

  if (metrics.avgSocial < 1) {
    suggestions.push({
      suggestion_type: 'general_wellness',
      message: 'You might benefit from more social interaction.',
      urgency_level: 'medium',
      recommended_action: 'Schedule regular social activities or reach out to friends and family'
    });
  }

  // If no specific issues, provide positive reinforcement
  if (suggestions.length === 0) {
    suggestions.push({
      suggestion_type: 'general_wellness',
      message: 'Your wellness metrics look good! Keep maintaining these healthy habits.',
      urgency_level: 'low',
      recommended_action: 'Continue with your current routine and monitor for any changes'
    });
  }

  return suggestions;
}
