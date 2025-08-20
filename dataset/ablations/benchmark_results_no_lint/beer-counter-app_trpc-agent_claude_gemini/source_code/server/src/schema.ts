import { z } from 'zod';

// Beer count schema
export const beerCountSchema = z.object({
  id: z.number(),
  count: z.number().int().nonnegative(), // Ensure count is non-negative integer
  last_updated: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type BeerCount = z.infer<typeof beerCountSchema>;

// Input schema for updating beer count
export const updateBeerCountInputSchema = z.object({
  count: z.number().int().nonnegative() // New count value
});

export type UpdateBeerCountInput = z.infer<typeof updateBeerCountInputSchema>;

// Input schema for increment/decrement operations
export const incrementBeerCountInputSchema = z.object({
  amount: z.number().int().default(1) // Amount to increment/decrement by (default 1)
});

export type IncrementBeerCountInput = z.infer<typeof incrementBeerCountInputSchema>;
