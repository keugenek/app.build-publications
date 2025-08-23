import { type TimerState } from '../schema';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

// In a real application, this would be stored in a proper state management system
// For now, we'll simulate it with a module-level variable
let currentTimerState: TimerState = {
  isRunning: false,
  currentTime: 25 * 60, // 25 minutes in seconds
  currentMode: 'work',
  pomodorosCompleted: 0
};

export const getTimerState = async (): Promise<TimerState> => {
  // Fetch the most recent Pomodoro session to determine pomodoros completed
  const sessions = await db.select()
    .from(pomodoroSessionsTable)
    .where(eq(pomodoroSessionsTable.isWorkSession, 1))
    .orderBy(desc(pomodoroSessionsTable.startTime))
    .limit(1);
  
  if (sessions.length > 0) {
    currentTimerState.pomodorosCompleted = sessions.length;
  }
  
  return currentTimerState;
};

export const updateTimerState = async (input: Partial<TimerState>): Promise<TimerState> => {
  try {
    // Update only the fields that are provided in the input
    if (input.isRunning !== undefined) {
      currentTimerState.isRunning = input.isRunning;
    }
    
    if (input.currentTime !== undefined) {
      currentTimerState.currentTime = input.currentTime;
    }
    
    if (input.currentMode !== undefined) {
      currentTimerState.currentMode = input.currentMode;
    }
    
    if (input.pomodorosCompleted !== undefined) {
      currentTimerState.pomodorosCompleted = input.pomodorosCompleted;
    }
    
    return currentTimerState;
  } catch (error) {
    console.error('Timer state update failed:', error);
    throw error;
  }
};
