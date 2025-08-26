import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type BreakAlert } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const checkBreakAlert = async (): Promise<BreakAlert> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const todayStr = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

    // Get all work sessions from today, ordered by start time descending
    const todaySessions = await db.select()
      .from(workSessionsTable)
      .where(eq(workSessionsTable.date, todayStr))
      .orderBy(desc(workSessionsTable.start_time))
      .execute();

    if (todaySessions.length === 0) {
      return {
        should_take_break: false,
        continuous_work_hours: 0,
        last_break_time: null,
        message: "No work sessions found for today."
      };
    }

    // Check if there's an ongoing work session (end_time is null and is_break is false)
    const ongoingWorkSession = todaySessions.find(session => 
      session.end_time === null && !session.is_break
    );

    if (!ongoingWorkSession) {
      // Find the most recent break session
      const lastBreakSession = todaySessions.find(session => session.is_break);
      
      return {
        should_take_break: false,
        continuous_work_hours: 0,
        last_break_time: lastBreakSession ? lastBreakSession.start_time : null,
        message: "No active work session detected."
      };
    }

    // Calculate continuous work hours from the current session start
    const currentTime = new Date();
    const sessionStartTime = new Date(ongoingWorkSession.start_time);
    
    // Find the last break before this work session
    const lastBreakBeforeCurrentSession = todaySessions
      .filter(session => 
        session.is_break && 
        session.start_time < ongoingWorkSession.start_time &&
        session.end_time !== null // Only completed breaks
      )
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

    // Calculate continuous work time
    // If there was a break before this session, start counting from session start
    // Otherwise, we need to look at previous work sessions too
    let continuousWorkStartTime = sessionStartTime;
    let lastBreakTime: Date | null = lastBreakBeforeCurrentSession ? lastBreakBeforeCurrentSession.start_time : null;

    // If no break found before current session, look for earlier work sessions
    if (!lastBreakBeforeCurrentSession) {
      // Find all completed work sessions before current session
      const previousWorkSessions = todaySessions
        .filter(session => 
          !session.is_break && 
          session.end_time !== null &&
          session.start_time < ongoingWorkSession.start_time
        )
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      if (previousWorkSessions.length > 0) {
        // Check for breaks between previous sessions
        let workStartTime = sessionStartTime;
        for (let i = previousWorkSessions.length - 1; i >= 0; i--) {
          const prevSession = previousWorkSessions[i];
          
          // Check if there's a break between this session and the previous one
          const breakBetween = todaySessions.find(session =>
            session.is_break &&
            session.start_time > prevSession.end_time! &&
            session.start_time < workStartTime
          );

          if (breakBetween) {
            lastBreakTime = breakBetween.start_time;
            break;
          }
          
          // Extend continuous work time to include this previous session
          workStartTime = prevSession.start_time;
        }
        continuousWorkStartTime = workStartTime;
      }
    }

    // Calculate hours of continuous work
    const continuousWorkMs = currentTime.getTime() - continuousWorkStartTime.getTime();
    const continuousWorkHours = continuousWorkMs / (1000 * 60 * 60);

    // Determine if break is needed (more than 4 hours of continuous work)
    const shouldTakeBreak = continuousWorkHours > 4;
    
    let message: string;
    if (shouldTakeBreak) {
      message = `You've been working for ${continuousWorkHours.toFixed(1)} hours straight. Consider taking a break!`;
    } else {
      const remainingTime = 4 - continuousWorkHours;
      message = `Currently working for ${continuousWorkHours.toFixed(1)} hours. ${remainingTime.toFixed(1)} hours until break recommended.`;
    }

    return {
      should_take_break: shouldTakeBreak,
      continuous_work_hours: parseFloat(continuousWorkHours.toFixed(2)),
      last_break_time: lastBreakTime,
      message
    };

  } catch (error) {
    console.error('Break alert check failed:', error);
    throw error;
  }
};
