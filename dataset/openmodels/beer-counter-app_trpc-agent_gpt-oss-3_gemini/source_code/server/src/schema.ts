import { z } from 'zod';

// Beer counter schema representing the persisted count
export const beerCounterSchema = z.object({
  id: z.number(),
  count: z.number().int(),
  updated_at: z.coerce.date()
});

export type BeerCounter = z.infer<typeof beerCounterSchema>;

// Input schema for updating the counter (increment, decrement, reset)
export const updateBeerCounterInputSchema = z.object({
  // The amount to adjust the count by. For reset this will be 0.
  delta: z.number().int()
});

export type UpdateBeerCounterInput = z.infer<typeof updateBeerCounterInputSchema>;
