import { db } from '../db';
import { attendanceTable } from '../db/schema';
import { type UpdateAttendanceInput, type Attendance } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAttendance = async (input: UpdateAttendanceInput): Promise<Attendance> => {
  try {
    // Build update values object with only provided fields
    const updateValues: any = {};
    
    if (input.attended !== undefined) {
      updateValues.attended = input.attended;
    }
    
    if (input.checked_in_at !== undefined) {
      updateValues.checked_in_at = input.checked_in_at;
    }
    
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // If attended is being set to true and no check-in time provided, set it to now
    if (input.attended === true && input.checked_in_at === undefined) {
      updateValues.checked_in_at = new Date();
    }

    // If attended is being set to false, clear check-in time unless explicitly provided
    if (input.attended === false && input.checked_in_at === undefined) {
      updateValues.checked_in_at = null;
    }

    // Update the attendance record
    const result = await db.update(attendanceTable)
      .set(updateValues)
      .where(eq(attendanceTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Attendance record with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Attendance update failed:', error);
    throw error;
  }
};
