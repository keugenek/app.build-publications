import { z } from 'zod';

// Plant schema with proper date handling
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  lastWateredDate: z.coerce.date(), // Automatically converts string timestamps to Date objects
  mood: z.enum(['Happy', 'Thirsty']), // Plant mood based on last watered date
  createdAt: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1, "Plant name is required"),
  lastWateredDate: z.coerce.date().optional() // Optional when creating, defaults to current date
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating plants
export const updatePlantInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Plant name is required").optional(),
  lastWateredDate: z.coerce.date().optional()
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;

// Input schema for watering a plant
export const waterPlantInputSchema = z.object({
  id: z.number()
});

export type WaterPlantInput = z.infer<typeof waterPlantInputSchema>;
