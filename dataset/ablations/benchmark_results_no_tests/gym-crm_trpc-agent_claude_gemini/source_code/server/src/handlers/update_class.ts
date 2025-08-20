import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // First, check if the class exists and get current data
    const existingClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.id))
      .execute();

    if (existingClasses.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    const existingClass = existingClasses[0];

    // If max_capacity is being reduced, validate that current bookings don't exceed new capacity
    if (input.max_capacity !== undefined && input.max_capacity < existingClass.current_bookings) {
      throw new Error(
        `Cannot reduce max capacity to ${input.max_capacity}. Current bookings: ${existingClass.current_bookings}`
      );
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.instructor_name !== undefined) updateData.instructor_name = input.instructor_name;
    if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes;
    if (input.max_capacity !== undefined) updateData.max_capacity = input.max_capacity;
    if (input.class_date !== undefined) updateData.class_date = input.class_date.toISOString().split('T')[0];
    if (input.start_time !== undefined) updateData.start_time = input.start_time;
    if (input.status !== undefined) updateData.status = input.status;

    // Update the class
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    // Convert class_date string back to Date object to match schema
    const updatedClass = result[0];
    return {
      ...updatedClass,
      class_date: new Date(updatedClass.class_date)
    };
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};
