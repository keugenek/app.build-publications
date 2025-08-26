import { z } from 'zod';

// Beer count schema
export const beerCountSchema = z.object({
  id: z.number(),
  count: z.number().int().nonnegative(), // Ensure count is non-negative integer
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BeerCount = z.infer<typeof beerCountSchema>;

// Input schema for updating beer count
export const updateBeerCountInputSchema = z.object({
  count: z.number().int().nonnegative()
});

export type UpdateBeerCountInput = z.infer<typeof updateBeerCountInputSchema>;

// Input schema for incrementing/decrementing beer count
export const incrementBeerCountInputSchema = z.object({
  increment: z.number().int() // Can be positive or negative for increment/decrement
});

export type IncrementBeerCountInput = z.infer<typeof incrementBeerCountInputSchema>;
