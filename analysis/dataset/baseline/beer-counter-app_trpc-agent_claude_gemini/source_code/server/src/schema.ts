import { z } from 'zod';

// Beer count schema - represents the current count state
export const beerCountSchema = z.object({
  id: z.number(),
  count: z.number().int().nonnegative(), // Ensures non-negative integer values
  updated_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type BeerCount = z.infer<typeof beerCountSchema>;

// Input schema for updating beer count
export const updateBeerCountInputSchema = z.object({
  count: z.number().int().nonnegative() // The new count value
});

export type UpdateBeerCountInput = z.infer<typeof updateBeerCountInputSchema>;

// Input schema for incrementing beer count
export const incrementBeerCountInputSchema = z.object({
  increment: z.number().int().positive().default(1) // Amount to increment by (default 1)
});

export type IncrementBeerCountInput = z.infer<typeof incrementBeerCountInputSchema>;

// Input schema for decrementing beer count
export const decrementBeerCountInputSchema = z.object({
  decrement: z.number().int().positive().default(1) // Amount to decrement by (default 1)
});

export type DecrementBeerCountInput = z.infer<typeof decrementBeerCountInputSchema>;