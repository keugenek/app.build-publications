import { type BeerCount } from '../schema';
import { getBeerCount } from './get_beer_count';

/**
 * Placeholder handler to reset the beer count to zero.
 * Real implementation would update the database accordingly.
 */
export const resetBeer = async (): Promise<BeerCount> => {
  const current = await getBeerCount();
  return {
    id: current.id,
    count: 0,
    updated_at: new Date(),
  } as BeerCount;
};
