import { type CreatePomodoroSettingsInput, type PomodoroSettings } from '../schema';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';

export const createPomodoroSettings = async (input: CreatePomodoroSettingsInput): Promise<PomodoroSettings> => {
  // Create new Pomodoro settings in the database
  const [settings] = await db.insert(pomodoroSettingsTable).values({
    workDuration: input.workDuration,
    shortBreakDuration: input.shortBreakDuration,
    longBreakDuration: input.longBreakDuration,
    longBreakInterval: input.longBreakInterval,
  }).returning();
  
  return settings as PomodoroSettings;
};
