import { z } from 'zod';

// Sunlight exposure enum
export const sunlightExposureSchema = z.enum(['Low', 'Medium', 'High']);
export type SunlightExposure = z.infer<typeof sunlightExposureSchema>;

// Plant mood enum
export const plantMoodSchema = z.enum(['Happy', 'Thirsty', 'Sun-deprived', 'Over-watered']);
export type PlantMood = z.infer<typeof plantMoodSchema>;

// Plant schema
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  last_watered: z.coerce.date(),
  sunlight_exposure: sunlightExposureSchema,
  created_at: z.coerce.date(),
  // Computed field - mood is calculated based on conditions
  mood: plantMoodSchema
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  last_watered: z.coerce.date(),
  sunlight_exposure: sunlightExposureSchema
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating plants
export const updatePlantInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Plant name is required').optional(),
  last_watered: z.coerce.date().optional(),
  sunlight_exposure: sunlightExposureSchema.optional()
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;

// Input schema for deleting plants
export const deletePlantInputSchema = z.object({
  id: z.number()
});

export type DeletePlantInput = z.infer<typeof deletePlantInputSchema>;
