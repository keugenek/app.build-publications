import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export type Statistics = {
  dailyAverage: {
    sleepHours: number;
    workHours: number;
    socialTime: number;
    screenTime: number;
    emotionalEnergy: number;
  };
  weeklyPattern: {
    weekStartDate: Date;
    sleepHours: number[];
    workHours: number[];
    socialTime: number[];
    screenTime: number[];
    emotionalEnergy: number[];
  }[];
};

export const getStatistics = async (userId: string): Promise<Statistics> => {
  try {
    // Get all activity entries for the user
    const entries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.user_id, userId))
      .orderBy(activityEntriesTable.date)
      .execute();

    // Convert string values back to numbers for numeric columns
    const parsedEntries = entries.map(entry => ({
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours),
      work_hours: parseFloat(entry.work_hours),
      social_time: parseFloat(entry.social_time),
      screen_time: parseFloat(entry.screen_time)
    }));

    // Calculate daily averages
    const dailyAverage = {
      sleepHours: parsedEntries.length > 0 
        ? parsedEntries.reduce((sum, entry) => sum + entry.sleep_hours, 0) / parsedEntries.length 
        : 0,
      workHours: parsedEntries.length > 0 
        ? parsedEntries.reduce((sum, entry) => sum + entry.work_hours, 0) / parsedEntries.length 
        : 0,
      socialTime: parsedEntries.length > 0 
        ? parsedEntries.reduce((sum, entry) => sum + entry.social_time, 0) / parsedEntries.length 
        : 0,
      screenTime: parsedEntries.length > 0 
        ? parsedEntries.reduce((sum, entry) => sum + entry.screen_time, 0) / parsedEntries.length 
        : 0,
      emotionalEnergy: parsedEntries.length > 0 
        ? parsedEntries.reduce((sum, entry) => sum + entry.emotional_energy, 0) / parsedEntries.length 
        : 0
    };

    // Group entries by week
    const weeklyData: { [key: string]: typeof parsedEntries } = {};
    
    parsedEntries.forEach(entry => {
      const date = new Date(entry.date);
      // Get the Monday of the week as the week identifier
      const weekStart = getWeekStartDate(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(entry);
    });

    // Create weekly pattern data
    const weeklyPattern = Object.entries(weeklyData).map(([weekKey, weekEntries]) => {
      // Initialize arrays for each day of the week (0-6, Sunday-Saturday)
      const sleepHours = Array(7).fill(0);
      const workHours = Array(7).fill(0);
      const socialTime = Array(7).fill(0);
      const screenTime = Array(7).fill(0);
      const emotionalEnergy = Array(7).fill(0);
      
      // Group entries by day of the week
      const dailyData: { [key: number]: typeof weekEntries } = {};
      
      weekEntries.forEach(entry => {
        const date = new Date(entry.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        if (!dailyData[dayOfWeek]) {
          dailyData[dayOfWeek] = [];
        }
        dailyData[dayOfWeek].push(entry);
      });
      
      // Calculate averages for each day of the week
      for (let day = 0; day < 7; day++) {
        const dayEntries = dailyData[day] || [];
        
        if (dayEntries.length > 0) {
          sleepHours[day] = dayEntries.reduce((sum, entry) => sum + entry.sleep_hours, 0) / dayEntries.length;
          workHours[day] = dayEntries.reduce((sum, entry) => sum + entry.work_hours, 0) / dayEntries.length;
          socialTime[day] = dayEntries.reduce((sum, entry) => sum + entry.social_time, 0) / dayEntries.length;
          screenTime[day] = dayEntries.reduce((sum, entry) => sum + entry.screen_time, 0) / dayEntries.length;
          emotionalEnergy[day] = dayEntries.reduce((sum, entry) => sum + entry.emotional_energy, 0) / dayEntries.length;
        }
      }
      
      return {
        weekStartDate: new Date(weekKey),
        sleepHours,
        workHours,
        socialTime,
        screenTime,
        emotionalEnergy
      };
    });

    return {
      dailyAverage,
      weeklyPattern
    };
  } catch (error) {
    console.error('Failed to get statistics:', error);
    throw error;
  }
};

// Helper function to get the start of the week (Monday) for a given date
const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Reset time to midnight
  return d;
};
