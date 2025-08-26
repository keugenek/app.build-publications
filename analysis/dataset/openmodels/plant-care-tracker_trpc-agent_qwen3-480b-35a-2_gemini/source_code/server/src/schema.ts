import { z } from 'zod';

// Plant schema with proper type definitions
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  species: z.string(),
  lastWatered: z.coerce.date(),
  lightExposure: z.enum(['low', 'medium', 'high']),
  createdAt: z.coerce.date()
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(100),
  lastWatered: z.coerce.date(),
  lightExposure: z.enum(['low', 'medium', 'high']).default('low')
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating plants
export const updatePlantInputSchema = plantSchema.partial().extend({
  id: z.number()
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;

// Return Plant with mood derived from rules in plain text
export const plantWithMoodSchema = plantSchema.extend({
  mood: z.string()
});

export type PlantWithMood = z.infer<typeof plantWithMoodSchema>;
