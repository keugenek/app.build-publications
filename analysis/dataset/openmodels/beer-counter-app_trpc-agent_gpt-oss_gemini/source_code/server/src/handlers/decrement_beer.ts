import { type BeerCount, type ChangeAmountInput } from '../schema';
import { getBeerCount } from './get_beer_count';

/**
 * Placeholder handler to decrement the beer count by the given amount (default 1).
 * Does not go below zero.
 */
export const decrementBeer = async (input: ChangeAmountInput): Promise<BeerCount> => {
  const amount = input.amount ?? 1;
  const current = await getBeerCount();
  const newCount = Math.max(0, current.count - amount);
  return {
    id: current.id,
    count: newCount,
    updated_at: new Date(),
  } as BeerCount;
};
