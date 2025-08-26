import { z } from 'zod';

// Enum for the type of cat activity
export const activityTypeEnum = z.enum([
  'staring',
  'gift',
  'night_prowl',
  'sneaky_meow',
  'clawing',
]);
export type ActivityType = z.infer<typeof activityTypeEnum>;

// Schema representing a stored activity log (output)
export const activityLogSchema = z.object({
  id: z.number(),
  cat_name: z.string(),
  activity_type: activityTypeEnum,
  description: z.string().nullable(), // optional description, can be explicitly null
  score: z.number().int().nonnegative(),
  created_at: z.coerce.date(), // timestamp converted to Date
});
export type ActivityLog = z.infer<typeof activityLogSchema>;

// Input schema for creating a new activity log
export const createActivityInputSchema = z.object({
  cat_name: z.string(),
  activity_type: activityTypeEnum,
  description: z.string().nullable().optional(), // description can be omitted or null
  score: z.number().int().nonnegative(),
});
export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Input schema for querying activities (e.g., filter by cat name)
export const getActivitiesInputSchema = z.object({
  cat_name: z.string().optional(), // optional filter
});
export type GetActivitiesInput = z.infer<typeof getActivitiesInputSchema>;
