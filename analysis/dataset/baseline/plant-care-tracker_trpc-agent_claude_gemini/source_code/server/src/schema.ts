import { z } from 'zod';

// Light exposure enum
export const lightExposureEnum = z.enum(['low', 'medium', 'high']);
export type LightExposure = z.infer<typeof lightExposureEnum>;

// Plant mood enum
export const plantMoodEnum = z.enum(['Happy', 'Thirsty', 'Needs Sun', 'Wilting']);
export type PlantMood = z.infer<typeof plantMoodEnum>;

// Plant schema
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  last_watered_date: z.coerce.date(),
  light_exposure: lightExposureEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Plant = z.infer<typeof plantSchema>;

// Plant with mood schema (includes calculated mood)
export const plantWithMoodSchema = plantSchema.extend({
  mood: plantMoodEnum
});

export type PlantWithMood = z.infer<typeof plantWithMoodSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1, "Plant name is required"),
  type: z.string().min(1, "Plant type is required"),
  last_watered_date: z.coerce.date(),
  light_exposure: lightExposureEnum
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating plants
export const updatePlantInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  last_watered_date: z.coerce.date().optional(),
  light_exposure: lightExposureEnum.optional()
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;

// Input schema for getting a single plant
export const getPlantInputSchema = z.object({
  id: z.number()
});

export type GetPlantInput = z.infer<typeof getPlantInputSchema>;

// Input schema for deleting a plant
export const deletePlantInputSchema = z.object({
  id: z.number()
});

export type DeletePlantInput = z.infer<typeof deletePlantInputSchema>;
