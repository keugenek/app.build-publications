import { type BeerCount } from '../schema';

export const resetBeerCount = async (): Promise<BeerCount> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is resetting the beer count to zero.
    // If no record exists, it should create one with count 0.
    return Promise.resolve({
        id: 1,
        count: 0,
        updated_at: new Date()
    } as BeerCount);
};