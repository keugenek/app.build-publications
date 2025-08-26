import { type PantryItem, type NearExpiryInput } from '../schema';

export const getNearExpiryItems = async (input: NearExpiryInput): Promise<PantryItem[]> => {
  // Placeholder: would query DB for items where expiry_date is within input.days (default 7)
  // For now, return empty array
  return [];
};
