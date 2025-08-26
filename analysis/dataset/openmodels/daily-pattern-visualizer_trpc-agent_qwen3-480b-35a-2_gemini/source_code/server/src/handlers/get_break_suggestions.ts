import { type BreakSuggestion, type DailyLog } from '../schema';

export const getBreakSuggestions = async (logs: DailyLog[]): Promise<BreakSuggestion[]> => {
  if (logs.length === 0) {
    return [];
  }

  // Calculate all averages
  let totalWorkHours = 0;
  let totalScreenTime = 0;
  let totalEmotionalEnergy = 0;
  let totalSocialTime = 0;
  
  for (const log of logs) {
    totalWorkHours += log.work_hours;
    totalScreenTime += log.screen_time;
    totalEmotionalEnergy += log.emotional_energy;
    totalSocialTime += log.social_time;
  }
  
  const avgWorkHours = totalWorkHours / logs.length;
  const avgScreenTime = totalScreenTime / logs.length;
  const avgEnergy = totalEmotionalEnergy / logs.length;
  const avgSocialTime = totalSocialTime / logs.length;
  
  const suggestions: BreakSuggestion[] = [];

  // Work break suggestions (8+ hours)
  if (avgWorkHours >= 8) {
    suggestions.push({
      type: 'work_break',
      message: `Your average work hours (${avgWorkHours.toFixed(1)}) are high. Consider taking regular breaks to avoid burnout.`,
      priority: avgWorkHours > 10 ? 'high' : 'medium'
    });
  }

  // Screen break suggestions (6+ hours) - always high priority when triggered
  if (avgScreenTime >= 6) {
    suggestions.push({
      type: 'screen_break',
      message: `Your average screen time (${avgScreenTime.toFixed(1)} hours) is high. Try taking regular screen breaks to reduce eye strain.`,
      priority: 'high'  // Always high priority once threshold is met
    });
  }

  // Energy boost suggestions (5 or below)
  if (avgEnergy <= 5) {
    suggestions.push({
      type: 'energy_boost',
      message: `Your average emotional energy (${avgEnergy.toFixed(1)}) is low. Consider activities that boost your mood and energy.`,
      priority: avgEnergy < 3 ? 'high' : 'medium'
    });
  }

  // Social suggestions (good energy but limited social time)
  if (avgEnergy > 5 && avgSocialTime < 2) {
    suggestions.push({
      type: 'social_suggestion',
      message: `Your social time is limited. Connecting with others can boost your well-being.`,
      priority: 'low'
    });
  }

  // Sort by priority (high first)
  return suggestions.sort((a, b) => {
    const priorityOrder = ['high', 'medium', 'low'];
    return priorityOrder.indexOf(b.priority) - priorityOrder.indexOf(a.priority);
  });
};
