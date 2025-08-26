import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type DailyMetrics } from '../schema';

export type BreakSuggestion = {
  type: 'sleep' | 'work' | 'screen' | 'social' | 'energy';
  message: string;
  recommendation: string;
};

export const getBreakSuggestions = async (): Promise<BreakSuggestion[]> => {
  try {
    // Get the last 7 days of metrics for analysis
    const recentMetrics = await db.select()
      .from(dailyMetricsTable)
      .orderBy(desc(dailyMetricsTable.date))
      .limit(7)
      .execute();

    // Convert numeric fields back to numbers and handle date conversion
    const metrics: DailyMetrics[] = recentMetrics.map(metric => ({
      ...metric,
      date: new Date(metric.date), // Convert string date to Date object
      sleep_duration: parseFloat(metric.sleep_duration),
      work_hours: parseFloat(metric.work_hours),
      social_time: parseFloat(metric.social_time),
      screen_time: parseFloat(metric.screen_time),
      created_at: new Date(metric.created_at) // Convert timestamp to Date object
    }));

    if (metrics.length === 0) {
      return [];
    }

    const suggestions: BreakSuggestion[] = [];

    // Analyze sleep patterns
    const avgSleep = metrics.reduce((sum, m) => sum + m.sleep_duration, 0) / metrics.length;
    if (avgSleep < 6) {
      suggestions.push({
        type: 'sleep',
        message: 'You are getting insufficient sleep',
        recommendation: 'Try to get at least 7-8 hours of sleep each night. Consider setting a consistent bedtime.'
      });
    } else if (avgSleep > 10) {
      suggestions.push({
        type: 'sleep',
        message: 'You are getting excessive sleep',
        recommendation: 'While rest is important, too much sleep can indicate health issues. Try to maintain 7-9 hours.'
      });
    }

    // Analyze work patterns
    const avgWorkHours = metrics.reduce((sum, m) => sum + m.work_hours, 0) / metrics.length;
    if (avgWorkHours > 9) {
      suggestions.push({
        type: 'work',
        message: 'You are working long hours',
        recommendation: 'Consider taking regular breaks during work and setting boundaries for work hours.'
      });
    }

    // Check for consecutive high work days
    const highWorkDays = metrics.filter(m => m.work_hours > 10).length;
    if (highWorkDays >= 3) {
      suggestions.push({
        type: 'work',
        message: 'You have been working long hours for several days',
        recommendation: 'Take a day off or significantly reduce your work hours to prevent burnout.'
      });
    }

    // Analyze screen time
    const avgScreenTime = metrics.reduce((sum, m) => sum + m.screen_time, 0) / metrics.length;
    if (avgScreenTime > 8) {
      suggestions.push({
        type: 'screen',
        message: 'You are spending excessive time on screens',
        recommendation: 'Take regular breaks from screens using the 20-20-20 rule (every 20 minutes, look at something 20 feet away for 20 seconds).'
      });
    }

    // Analyze social time
    const avgSocialTime = metrics.reduce((sum, m) => sum + m.social_time, 0) / metrics.length;
    if (avgSocialTime < 1) {
      suggestions.push({
        type: 'social',
        message: 'You have limited social interaction',
        recommendation: 'Make time for social activities or connect with friends and family.'
      });
    }

    // Analyze emotional energy
    const avgEnergy = metrics.reduce((sum, m) => sum + m.emotional_energy, 0) / metrics.length;
    if (avgEnergy < 4) {
      suggestions.push({
        type: 'energy',
        message: 'Your emotional energy levels are consistently low',
        recommendation: 'Prioritize activities that boost your mood and consider taking a break from demanding tasks.'
      });
    }

    // Check for declining energy trend
    if (metrics.length >= 3) {
      const recentEnergy = metrics.slice(0, 3).reduce((sum, m) => sum + m.emotional_energy, 0) / 3;
      const olderEnergy = metrics.slice(3).reduce((sum, m) => sum + m.emotional_energy, 0) / (metrics.length - 3);
      
      if (recentEnergy < olderEnergy && recentEnergy < 5) {
        suggestions.push({
          type: 'energy',
          message: 'Your emotional energy is declining',
          recommendation: 'Take a break and engage in activities that rejuvenate you.'
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Failed to generate break suggestions:', error);
    throw error;
  }
};
