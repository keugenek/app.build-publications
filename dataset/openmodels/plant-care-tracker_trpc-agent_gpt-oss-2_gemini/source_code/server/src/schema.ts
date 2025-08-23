import { z } from 'zod';

// Plant output schema (matches DB columns)
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  species: z.string(),
  last_watered: z.coerce.date(), // timestamp column converted to Date
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating a plant
export const createPlantInputSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  // Accept string or Date, will be coerced to Date; optional – defaults to now in DB
  last_watered: z.coerce.date().optional(),
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;
