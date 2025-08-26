import { z } from 'zod';

// Plant schema representing the full plant record including computed mood
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  species: z.string(),
  last_watered_at: z.coerce.date(),
  created_at: z.coerce.date(),
  // Mood is derived, not stored in DB, but part of the API response
  mood: z.enum(['happy', 'thirsty'])
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating a plant
export const createPlantInputSchema = z.object({
  name: z.string(),
  species: z.string(),
  // If omitted, the backend can default to now
  last_watered_at: z.coerce.date().optional()
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating a plant
export const updatePlantInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  species: z.string().optional(),
  last_watered_at: z.coerce.date().optional()
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;
