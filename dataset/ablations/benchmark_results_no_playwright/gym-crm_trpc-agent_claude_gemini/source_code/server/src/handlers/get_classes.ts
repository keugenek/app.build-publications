import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { eq, ilike, and, type SQL } from 'drizzle-orm';
import { z } from 'zod';

// Input schema for filtering classes
export const getClassesInputSchema = z.object({
  is_active: z.boolean().optional(),
  class_type: z.enum(['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  instructor: z.string().optional() // Search by instructor name
});

export type GetClassesInput = z.infer<typeof getClassesInputSchema>;

export const getClasses = async (input: GetClassesInput = {}): Promise<Class[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Filter by active status (defaults to true if not specified)
    const isActive = input.is_active !== undefined ? input.is_active : true;
    conditions.push(eq(classesTable.is_active, isActive));

    // Filter by class type
    if (input.class_type) {
      conditions.push(eq(classesTable.class_type, input.class_type));
    }

    // Filter by difficulty level
    if (input.difficulty_level) {
      conditions.push(eq(classesTable.difficulty_level, input.difficulty_level));
    }

    // Filter by instructor name (case-insensitive search)
    if (input.instructor) {
      conditions.push(ilike(classesTable.instructor_name, `%${input.instructor}%`));
    }

    // Build query with conditions
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
    
    const results = await db.select()
      .from(classesTable)
      .where(whereClause)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
