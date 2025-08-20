import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type BreakSuggestion } from '../schema';
import { eq, gte, desc } from 'drizzle-orm';

export async function getBreakSuggestions(userId: string): Promise<BreakSuggestion[]> {
  try {
    // Get recent activity logs for analysis (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityLogs = await db.select()
      .from(activityLogsTable)
      .where(
        eq(activityLogsTable.user_id, userId)
      )
      .orderBy(desc(activityLogsTable.date))
      .limit(30)
      .execute();

    // If no data available, return default suggestions
    if (activityLogs.length === 0) {
      return getDefaultSuggestions(userId);
    }

    // Analyze patterns and generate personalized suggestions
    const suggestions: BreakSuggestion[] = [];
    
    // Calculate averages for pattern analysis
    const avgWorkHours = activityLogs.reduce((sum, log) => sum + parseFloat(log.work_hours), 0) / activityLogs.length;
    const avgEnergyLevel = activityLogs.reduce((sum, log) => sum + log.emotional_energy, 0) / activityLogs.length;
    const avgScreenHours = activityLogs.reduce((sum, log) => sum + parseFloat(log.screen_hours), 0) / activityLogs.length;
    const avgSocialHours = activityLogs.reduce((sum, log) => sum + parseFloat(log.social_hours), 0) / activityLogs.length;

    // Morning break suggestion based on work patterns
    if (avgWorkHours >= 6) {
      suggestions.push({
        user_id: userId,
        suggested_time: "10:30 AM",
        activity_type: "short_break",
        reason: `Based on your ${avgWorkHours.toFixed(1)} average work hours, a mid-morning break helps maintain productivity`,
        confidence: Math.min(0.9, 0.6 + (avgWorkHours - 6) * 0.05)
      });
    }

    // Afternoon break based on energy patterns
    if (avgEnergyLevel <= 6) {
      suggestions.push({
        user_id: userId,
        suggested_time: "2:30 PM",
        activity_type: "exercise",
        reason: `Your average energy level is ${avgEnergyLevel.toFixed(1)}/10. Physical activity can boost afternoon energy`,
        confidence: Math.max(0.5, 1 - (avgEnergyLevel / 10))
      });
    } else {
      suggestions.push({
        user_id: userId,
        suggested_time: "2:30 PM",
        activity_type: "short_break",
        reason: `With good energy levels (${avgEnergyLevel.toFixed(1)}/10), a brief break maintains your momentum`,
        confidence: 0.75
      });
    }

    // Screen time break suggestion
    if (avgScreenHours >= 6) {
      suggestions.push({
        user_id: userId,
        suggested_time: "12:00 PM",
        activity_type: "long_break",
        reason: `High screen time (${avgScreenHours.toFixed(1)} hrs/day) indicates need for extended eye rest during lunch`,
        confidence: Math.min(0.95, 0.6 + (avgScreenHours - 6) * 0.1)
      });
    }

    // Social break suggestion based on social activity levels
    if (avgSocialHours <= 2) {
      suggestions.push({
        user_id: userId,
        suggested_time: "5:30 PM",
        activity_type: "social_time",
        reason: `Your social activity is low (${avgSocialHours.toFixed(1)} hrs/day). Evening social interaction can improve well-being`,
        confidence: Math.max(0.6, 1 - (avgSocialHours / 4))
      });
    }

    // Late afternoon productivity break for high work hours
    if (avgWorkHours >= 8) {
      suggestions.push({
        user_id: userId,
        suggested_time: "4:00 PM",
        activity_type: "short_break",
        reason: `Extended work days (${avgWorkHours.toFixed(1)} hrs) benefit from late afternoon recharge breaks`,
        confidence: Math.min(0.85, 0.5 + (avgWorkHours - 8) * 0.1)
      });
    }

    // Sort suggestions by confidence and limit to top 4
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4);

  } catch (error) {
    console.error('Failed to generate break suggestions:', error);
    // Return default suggestions on error
    return getDefaultSuggestions(userId);
  }
}

// Default suggestions when no user data is available
function getDefaultSuggestions(userId: string): BreakSuggestion[] {
  return [
    {
      user_id: userId,
      suggested_time: "10:30 AM",
      activity_type: "short_break",
      reason: "Mid-morning breaks help maintain focus and productivity",
      confidence: 0.7
    },
    {
      user_id: userId,
      suggested_time: "2:30 PM",
      activity_type: "exercise",
      reason: "Afternoon physical activity combats post-lunch energy dip",
      confidence: 0.75
    },
    {
      user_id: userId,
      suggested_time: "12:00 PM",
      activity_type: "long_break",
      reason: "Lunch break provides essential midday recovery time",
      confidence: 0.8
    }
  ];
}
