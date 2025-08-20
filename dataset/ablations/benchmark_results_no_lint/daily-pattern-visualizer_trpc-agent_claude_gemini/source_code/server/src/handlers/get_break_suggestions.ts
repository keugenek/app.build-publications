import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type BreakSuggestion } from '../schema';
import { desc, gte, sql } from 'drizzle-orm';

export const getBreakSuggestions = async (): Promise<BreakSuggestion[]> => {
  try {
    // Get recent entries (last 7 days) for analysis
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEntries = await db.select()
      .from(wellBeingEntriesTable)
      .where(gte(wellBeingEntriesTable.date, sevenDaysAgo.toISOString().split('T')[0]))
      .orderBy(desc(wellBeingEntriesTable.date))
      .limit(7)
      .execute();

    const suggestions: BreakSuggestion[] = [];

    if (recentEntries.length === 0) {
      // No recent data - provide general wellness suggestion
      suggestions.push({
        suggestion_type: 'general_wellness',
        message: 'Welcome to your wellness tracker! Start logging your daily activities to get personalized suggestions.',
        urgency_level: 'low',
        recommended_action: 'Log your first well-being entry to begin getting personalized break recommendations'
      });
      return suggestions;
    }

    // Calculate averages from recent entries
    const totalEntries = recentEntries.length;
    const avgWorkHours = recentEntries.reduce((sum, entry) => sum + entry.work_hours, 0) / totalEntries;
    const avgScreenTime = recentEntries.reduce((sum, entry) => sum + entry.screen_time_hours, 0) / totalEntries;
    const avgSleepHours = recentEntries.reduce((sum, entry) => sum + entry.sleep_hours, 0) / totalEntries;
    const avgEnergyLevel = recentEntries.reduce((sum, entry) => sum + entry.emotional_energy_level, 0) / totalEntries;
    const avgSocialTime = recentEntries.reduce((sum, entry) => sum + entry.social_time_hours, 0) / totalEntries;

    // Get today's entry if available
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = recentEntries.find(entry => entry.date === today);

    // Work break suggestions (high priority)
    if (avgWorkHours > 10) {
      suggestions.push({
        suggestion_type: 'work_break',
        message: 'You\'ve been working over 10 hours daily on average. This can lead to burnout.',
        urgency_level: 'high',
        recommended_action: 'Take a 30-minute walk outside, do some stretching, or practice deep breathing exercises'
      });
    } else if (todayEntry && todayEntry.work_hours > 8) {
      suggestions.push({
        suggestion_type: 'work_break',
        message: 'You\'ve worked more than 8 hours today. Time for a meaningful break!',
        urgency_level: 'medium',
        recommended_action: 'Step away from work for at least 15 minutes. Try a short walk or some light exercise'
      });
    } else if (avgWorkHours > 8) {
      suggestions.push({
        suggestion_type: 'work_break',
        message: 'Your work hours are consistently above average. Consider taking regular breaks.',
        urgency_level: 'low',
        recommended_action: 'Schedule 5-10 minute breaks every hour to maintain productivity and well-being'
      });
    }

    // Screen time suggestions (medium priority)
    if (avgScreenTime > 8) {
      suggestions.push({
        suggestion_type: 'screen_break',
        message: 'Your daily screen time is quite high. Your eyes and posture may need attention.',
        urgency_level: 'high',
        recommended_action: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds'
      });
    } else if (todayEntry && todayEntry.screen_time_hours > 6) {
      suggestions.push({
        suggestion_type: 'screen_break',
        message: 'You\'ve had significant screen time today. Consider a digital break.',
        urgency_level: 'medium',
        recommended_action: 'Take a 10-15 minute break from all screens and do some eye exercises'
      });
    } else if (avgScreenTime > 6) {
      suggestions.push({
        suggestion_type: 'screen_break',
        message: 'Your screen time is above recommended levels. Regular breaks can help.',
        urgency_level: 'low',
        recommended_action: 'Try to reduce screen time by taking short breaks every 30 minutes'
      });
    }

    // General wellness suggestions based on multiple factors
    if (avgEnergyLevel < 4) {
      suggestions.push({
        suggestion_type: 'general_wellness',
        message: 'Your energy levels have been consistently low. This may indicate you need more rest or lifestyle changes.',
        urgency_level: 'high',
        recommended_action: 'Focus on getting 7-9 hours of sleep, eating nutritious meals, and light physical activity'
      });
    } else if (avgSleepHours < 6) {
      suggestions.push({
        suggestion_type: 'general_wellness',
        message: 'You\'re not getting enough sleep on average. This can impact your energy and health.',
        urgency_level: 'high',
        recommended_action: 'Aim for 7-9 hours of sleep tonight. Consider establishing a regular bedtime routine'
      });
    } else if (avgSocialTime < 1) {
      suggestions.push({
        suggestion_type: 'general_wellness',
        message: 'Your social interaction time is quite low. Social connections are important for well-being.',
        urgency_level: 'medium',
        recommended_action: 'Schedule time with friends, family, or colleagues. Even a short phone call can help'
      });
    } else if (avgEnergyLevel < 6) {
      suggestions.push({
        suggestion_type: 'general_wellness',
        message: 'Your energy levels could be improved with some lifestyle adjustments.',
        urgency_level: 'low',
        recommended_action: 'Try incorporating light exercise, better nutrition, or mindfulness practices into your day'
      });
    }

    // If no specific suggestions were generated, provide a general positive message
    if (suggestions.length === 0) {
      suggestions.push({
        suggestion_type: 'general_wellness',
        message: 'Your well-being metrics look balanced! Keep up the good work.',
        urgency_level: 'low',
        recommended_action: 'Continue maintaining your healthy routine and consider setting new wellness goals'
      });
    }

    // Sort suggestions by urgency (high -> medium -> low)
    const urgencyOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    suggestions.sort((a, b) => urgencyOrder[a.urgency_level] - urgencyOrder[b.urgency_level]);

    // Limit to top 3 suggestions to avoid overwhelming the user
    return suggestions.slice(0, 3);

  } catch (error) {
    console.error('Failed to generate break suggestions:', error);
    throw error;
  }
};
