import { z } from 'zod';

// Define the predefined suspicious activities with their scores
export const suspiciousActivityTypes = [
  'Prolonged Staring',
  'Midnight Zoomies',
  'Leaving \'Gifts\' (dead insects, toys, etc.)',
  'Silent Judgment',
  'Plotting on the Keyboard'
] as const;

export const suspiciousActivityTypeEnum = z.enum(suspiciousActivityTypes);

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  description: z.string(),
  suspicion_score: z.number().int(),
  activity_type: suspiciousActivityTypeEnum,
  created_at: z.coerce.date(),
  date: z.coerce.date(), // The date this activity happened
});

export type Activity = z.infer<typeof activitySchema>;

// Input schema for creating activities
export const createActivityInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  activity_type: suspiciousActivityTypeEnum,
  date: z.coerce.date().optional(), // Optional - defaults to today
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Conspiracy level response
export const conspiracyLevelSchema = z.object({
  date: z.coerce.date(),
  total_suspicion_score: z.number().int(),
});

export type ConspiracyLevel = z.infer<typeof conspiracyLevelSchema>;
