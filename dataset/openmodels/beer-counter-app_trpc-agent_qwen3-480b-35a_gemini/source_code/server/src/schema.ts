import { z } from 'zod';

// Beer counter schema
export const beerCounterSchema = z.object({
  id: z.number(),
  count: z.number().int(),
  updated_at: z.coerce.date()
});

export type BeerCounter = z.infer<typeof beerCounterSchema>;

// Input schema for updating beer count
export const updateBeerCountInputSchema = z.object({
  count: z.number().int()
});

export type UpdateBeerCountInput = z.infer<typeof updateBeerCountInputSchema>;
