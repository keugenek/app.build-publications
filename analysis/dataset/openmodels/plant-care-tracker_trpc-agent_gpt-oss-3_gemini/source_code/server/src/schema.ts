import { z } from 'zod';

// Plant mood enum
export const moodEnum = ['Happy', 'Thirsty'] as const;
export const moodSchema = z.enum(moodEnum);
export type Mood = z.infer<typeof moodSchema>;

// Plant type can be any string; optionally could be enum in future
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  last_watered: z.coerce.date(), // stored as timestamp in DB
  // mood is derived, not stored in DB, but included in output
  mood: moodSchema,
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating a plant
export const createPlantInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  // last_watered optional; if omitted, default to now in handler
  last_watered: z.coerce.date().optional(),
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating a plant's last watered date
export const updatePlantInputSchema = z.object({
  id: z.number(),
  last_watered: z.coerce.date(),
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;
