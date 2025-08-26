import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type ActivityPattern } from '../schema';
import { eq, avg, count } from 'drizzle-orm';

export const getActivityPatterns = async (userId: string): Promise<ActivityPattern> => {
  try {
    // Get all activity logs for the user
    const logs = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.user_id, userId))
      .execute();

    if (logs.length === 0) {
      // Return default pattern for users with no data
      return {
        user_id: userId,
        average_sleep: 0,
        average_work: 0,
        average_social: 0,
        average_screen: 0,
        average_energy: 0,
        total_days: 0,
        optimal_work_time: null,
        break_suggestions: [
          "Start tracking your daily activities to get personalized insights",
          "Log at least 7 days of data for meaningful patterns"
        ]
      };
    }

    // Calculate averages - convert numeric strings to numbers
    const avgSleep = logs.reduce((sum, log) => sum + parseFloat(log.sleep_hours), 0) / logs.length;
    const avgWork = logs.reduce((sum, log) => sum + parseFloat(log.work_hours), 0) / logs.length;
    const avgSocial = logs.reduce((sum, log) => sum + parseFloat(log.social_hours), 0) / logs.length;
    const avgScreen = logs.reduce((sum, log) => sum + parseFloat(log.screen_hours), 0) / logs.length;
    const avgEnergy = logs.reduce((sum, log) => sum + log.emotional_energy, 0) / logs.length;

    // Determine optimal work time based on energy patterns
    const highEnergyDays = logs.filter(log => log.emotional_energy >= 7);
    let optimalWorkTime = null;

    if (avgEnergy >= 7) {
      optimalWorkTime = "9:00 AM - 12:00 PM";
    } else if (avgEnergy >= 5) {
      optimalWorkTime = "10:00 AM - 1:00 PM";
    } else if (avgEnergy >= 3) {
      optimalWorkTime = "11:00 AM - 2:00 PM";
    }

    // Generate break suggestions based on patterns
    const breakSuggestions: string[] = [];

    // Work-related suggestions
    if (avgWork > 8) {
      breakSuggestions.push("Consider taking more frequent breaks during long work days");
    }
    if (avgWork > 10) {
      breakSuggestions.push("Your work hours are quite high - ensure you're taking adequate rest");
    }

    // Screen time suggestions
    if (avgScreen > 8) {
      breakSuggestions.push("Try to reduce screen time to improve eye health and sleep quality");
    }
    if (avgScreen > 6 && avgSleep < 7) {
      breakSuggestions.push("High screen time may be affecting your sleep - consider a digital detox before bed");
    }

    // Sleep suggestions
    if (avgSleep < 7) {
      breakSuggestions.push("Aim for 7-9 hours of sleep per night for optimal energy levels");
    }
    if (avgSleep > 9) {
      breakSuggestions.push("You're getting plenty of sleep - great for maintaining high energy!");
    }

    // Social activity suggestions
    if (avgSocial < 1) {
      breakSuggestions.push("Consider scheduling more social activities to improve work-life balance");
    }

    // Energy-based suggestions
    if (avgEnergy < 5) {
      breakSuggestions.push("Focus on activities that boost your energy: exercise, better sleep, or stress management");
    }

    // Default suggestions if none were added
    if (breakSuggestions.length === 0) {
      breakSuggestions.push("Your activity patterns look balanced - keep up the good work!");
      breakSuggestions.push("Continue tracking to identify long-term trends");
    }

    return {
      user_id: userId,
      average_sleep: Math.round(avgSleep * 100) / 100, // Round to 2 decimal places
      average_work: Math.round(avgWork * 100) / 100,
      average_social: Math.round(avgSocial * 100) / 100,
      average_screen: Math.round(avgScreen * 100) / 100,
      average_energy: Math.round(avgEnergy * 100) / 100,
      total_days: logs.length,
      optimal_work_time: optimalWorkTime,
      break_suggestions: breakSuggestions
    };
  } catch (error) {
    console.error('Activity patterns analysis failed:', error);
    throw error;
  }
};
