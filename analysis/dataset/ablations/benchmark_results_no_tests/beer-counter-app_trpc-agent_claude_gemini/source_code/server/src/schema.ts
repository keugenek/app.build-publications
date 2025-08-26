import { z } from 'zod';

// Counter schema for beer counting
export const counterSchema = z.object({
  id: z.number(),
  count: z.number().int().nonnegative(), // Ensures non-negative integer values
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Counter = z.infer<typeof counterSchema>;

// Input schema for creating a counter
export const createCounterInputSchema = z.object({
  count: z.number().int().nonnegative().default(0) // Default to 0 beers
});

export type CreateCounterInput = z.infer<typeof createCounterInputSchema>;

// Input schema for updating counter
export const updateCounterInputSchema = z.object({
  id: z.number(),
  count: z.number().int().nonnegative()
});

export type UpdateCounterInput = z.infer<typeof updateCounterInputSchema>;

// Input schema for increment operation
export const incrementCounterInputSchema = z.object({
  id: z.number(),
  amount: z.number().int().positive().default(1) // Default increment by 1
});

export type IncrementCounterInput = z.infer<typeof incrementCounterInputSchema>;

// Input schema for decrement operation
export const decrementCounterInputSchema = z.object({
  id: z.number(),
  amount: z.number().int().positive().default(1) // Default decrement by 1
});

export type DecrementCounterInput = z.infer<typeof decrementCounterInputSchema>;

// Input schema for reset operation
export const resetCounterInputSchema = z.object({
  id: z.number()
});

export type ResetCounterInput = z.infer<typeof resetCounterInputSchema>;
