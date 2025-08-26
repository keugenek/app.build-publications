export * from './create_class';
// Implemented getClasses handler
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';

export const getClasses = async (): Promise<Class[]> => {
  try {
    const rows = await db.select().from(classesTable).execute();
    // rows already contain Date objects for timestamp columns
    return rows as Class[];
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};

// Re-export other handlers
export * from './create_class';
export * from './update_class';
export * from './delete_class';
export * from './create_member';
export * from './get_members';
export * from './update_member';
export * from './delete_member';
export * from './create_reservation';
export * from './get_reservations';
export * from './cancel_reservation';
export * from './update_class';
export * from './delete_class';
export * from './create_member';
export * from './get_members';
export * from './update_member';
export * from './delete_member';
export * from './create_reservation';
export * from './get_reservations';
export * from './cancel_reservation';
