import { z } from 'zod';

// Plant schema with proper date handling
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  last_watered: z.coerce.date(), // Automatically converts string timestamps to Date objects
  created_at: z.coerce.date()
});

export type Plant = z.infer<typeof plantSchema>;

// Plant mood enum for type safety
export const plantMoodSchema = z.enum(['Happy', 'Thirsty']);
export type PlantMood = z.infer<typeof plantMoodSchema>;

// Plant with calculated mood
export const plantWithMoodSchema = plantSchema.extend({
  mood: plantMoodSchema
});

export type PlantWithMood = z.infer<typeof plantWithMoodSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  last_watered: z.coerce.date() // Allow date string or Date object
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating plant's last watered date
export const updatePlantWateredInputSchema = z.object({
  id: z.number(),
  last_watered: z.coerce.date()
});

export type UpdatePlantWateredInput = z.infer<typeof updatePlantWateredInputSchema>;
