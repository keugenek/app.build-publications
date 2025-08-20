import { db } from '../db';
import { classSchedulesTable, classesTable } from '../db/schema';
import { type CalendarDay } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function getCalendarView(dateFrom: Date, dateTo: Date): Promise<CalendarDay[]> {
  try {
    // Convert dates to strings for database comparison (YYYY-MM-DD format)
    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    // Query class schedules with joined class information for the date range
    const results = await db.select()
      .from(classSchedulesTable)
      .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id))
      .where(
        and(
          gte(classSchedulesTable.scheduled_date, dateFromStr),
          lte(classSchedulesTable.scheduled_date, dateToStr)
        )
      )
      .execute();

    // Group results by date
    const groupedByDate = new Map<string, CalendarDay>();

    for (const result of results) {
      const schedule = result.class_schedules;
      const classInfo = result.classes;
      
      // scheduled_date is already a string in YYYY-MM-DD format
      const dateString = schedule.scheduled_date;

      if (!groupedByDate.has(dateString)) {
        groupedByDate.set(dateString, {
          date: dateString,
          classes: []
        });
      }

      const calendarDay = groupedByDate.get(dateString)!;
      calendarDay.classes.push({
        schedule_id: schedule.id,
        class_id: classInfo.id,
        class_name: classInfo.name,
        instructor_name: classInfo.instructor_name,
        start_time: schedule.start_time.substring(0, 5), // Convert "HH:MM:SS" to "HH:MM"
        end_time: schedule.end_time.substring(0, 5), // Convert "HH:MM:SS" to "HH:MM"
        duration_minutes: classInfo.duration_minutes,
        current_bookings: schedule.current_bookings,
        max_capacity: classInfo.max_capacity,
        class_type: classInfo.class_type,
        difficulty_level: classInfo.difficulty_level,
        is_cancelled: schedule.is_cancelled,
        cancellation_reason: schedule.cancellation_reason
      });
    }

    // Convert map to array and sort by date
    return Array.from(groupedByDate.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  } catch (error) {
    console.error('Get calendar view failed:', error);
    throw error;
  }
}
