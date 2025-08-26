import { z } from 'zod';

// Enum representing possible suspicious cat activities
export const activityTypeEnum = z.enum([
  'PROLONGED_STARING',
  'DEAD_INSECT_GIFT',
  'LIVE_ANIMAL_GIFT',
  'MIDNIGHT_ZOOMIES',
  'IGNORING_COMMANDS',
  'INTENSE_GROOMING_GLANCE',
]);
export type ActivityType = z.infer<typeof activityTypeEnum>;

// Schema for a logged activity (output)
export const activitySchema = z.object({
  id: z.number(),
  type: activityTypeEnum,
  points: z.number().int(),
  created_at: z.coerce.date(), // timestamp from DB converted to Date
});
export type Activity = z.infer<typeof activitySchema>;

// Input schema for logging a new activity (mutation)
export const logActivityInputSchema = z.object({
  type: activityTypeEnum,
});
export type LogActivityInput = z.infer<typeof logActivityInputSchema>;

// Schema for daily conspiracy level output
export const dailyConspiracySchema = z.object({
  date: z.coerce.date(),
  totalPoints: z.number().int(),
  activities: z.array(activitySchema),
});
export type DailyConspiracy = z.infer<typeof dailyConspiracySchema>;
