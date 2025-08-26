import { z } from 'zod';

// Beer count schema representing a row in the database
export const beerCountSchema = z.object({
  id: z.number(),
  count: z.number().int().nonnegative(), // non‑negative integer count of beers
  updated_at: z.coerce.date(), // timestamp of last update
});

export type BeerCount = z.infer<typeof beerCountSchema>;

// Input schema for increment/decrement operations – optional amount (default 1)
export const changeAmountInputSchema = z.object({
  amount: z.number().int().positive().optional(), // defaults to 1 in handler
});

export type ChangeAmountInput = z.infer<typeof changeAmountInputSchema>;
