import { type BreakSuggestion } from '../schema';

export const getBreakSuggestions = async (workHours: number, screenTime: number): Promise<BreakSuggestion> => {
  try {
    const suggestions: string[] = [];
    
    // Validate input ranges
    if (workHours < 0 || workHours > 24) {
      throw new Error('Work hours must be between 0 and 24');
    }
    
    if (screenTime < 0 || screenTime > 24) {
      throw new Error('Screen time must be between 0 and 24');
    }
    
    // Generate suggestions based on work hours
    if (workHours > 10) {
      suggestions.push("You've worked over 10 hours today. This is excessive - consider delegating tasks and setting boundaries.");
      suggestions.push("Take a 15-30 minute break every 2 hours to prevent burnout.");
    } else if (workHours > 8) {
      suggestions.push("You've worked over 8 hours today. Consider taking a longer break to rest and recharge.");
      suggestions.push("Schedule some downtime this evening to decompress.");
    } else if (workHours > 6) {
      suggestions.push("Good work today! Take short breaks every hour to maintain productivity.");
    } else if (workHours > 0) {
      suggestions.push("Light work day - great for maintaining work-life balance!");
    }
    
    // Generate suggestions based on screen time
    if (screenTime > 10) {
      suggestions.push("Very high screen time detected. Your eyes need immediate rest - take a 20-minute break away from screens.");
      suggestions.push("Consider using blue light filters and ensure proper lighting in your workspace.");
    } else if (screenTime > 8) {
      suggestions.push("High screen time detected. Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.");
      suggestions.push("Consider taking a walk or doing some physical activity to rest your eyes.");
    } else if (screenTime > 6) {
      suggestions.push("Moderate screen time. Remember to blink frequently and adjust your screen brightness.");
      suggestions.push("Take regular breaks to stretch and move around.");
    } else if (screenTime > 4) {
      suggestions.push("Good screen time management. Keep taking regular breaks.");
    }
    
    // Combined high usage suggestions
    if (workHours > 8 && screenTime > 8) {
      suggestions.push("Both work and screen time are high. Prioritize getting good sleep tonight and consider meditation.");
      suggestions.push("Tomorrow, try to incorporate more non-screen work activities if possible.");
    }
    
    // Low activity suggestions
    if (workHours < 2 && screenTime < 2) {
      suggestions.push("Light day overall. This is great for recovery and maintaining balance.");
    }
    
    // Screen time exceeds work time significantly
    if (screenTime > workHours + 3 && workHours > 0) {
      suggestions.push("Screen time significantly exceeds work hours. Consider reducing recreational screen time.");
    }
    
    // Default suggestion if no specific conditions are met
    if (suggestions.length === 0) {
      suggestions.push("Great balance today! Keep maintaining healthy work and screen time habits.");
      suggestions.push("Remember to stay hydrated and take breaks when needed.");
    }
    
    return {
      work_hours: workHours,
      screen_time: screenTime,
      suggestions
    };
  } catch (error) {
    console.error('Break suggestions generation failed:', error);
    throw error;
  }
};
