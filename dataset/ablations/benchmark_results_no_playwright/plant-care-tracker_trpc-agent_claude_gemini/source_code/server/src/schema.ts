import { z } from 'zod';

// Plant mood enum
export const plantMoodEnum = ['Happy', 'Thirsty'] as const;

// Plant schema
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  last_watered: z.coerce.date(), // Automatically converts string timestamps to Date objects
  created_at: z.coerce.date(),
});

export type Plant = z.infer<typeof plantSchema>;

// Plant with computed mood
export const plantWithMoodSchema = plantSchema.extend({
  mood: z.enum(plantMoodEnum),
});

export type PlantWithMood = z.infer<typeof plantWithMoodSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  last_watered: z.coerce.date().optional(), // Optional, defaults to now if not provided
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating last watered date
export const updatePlantWateredInputSchema = z.object({
  id: z.number(),
  last_watered: z.coerce.date(),
});

export type UpdatePlantWateredInput = z.infer<typeof updatePlantWateredInputSchema>;
