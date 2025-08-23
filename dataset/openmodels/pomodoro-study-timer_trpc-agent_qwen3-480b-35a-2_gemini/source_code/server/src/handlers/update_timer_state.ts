import { type TimerState } from '../schema';

// In a real application, this would be stored in a proper state management system
// For now, we'll simulate it with a module-level variable
let currentTimerState: TimerState = {
  isRunning: false,
  currentTime: 25 * 60, // 25 minutes in seconds
  currentMode: 'work',
  pomodorosCompleted: 0
};

export const getTimerState = async (): Promise<TimerState> => {
  return currentTimerState;
};

export const updateTimerState = async (input: Partial<TimerState>): Promise<TimerState> => {
  // Update the timer state
  currentTimerState = {
    ...currentTimerState,
    ...input
  };
  
  return currentTimerState;
};
