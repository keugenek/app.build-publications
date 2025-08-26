import { type PantryItem } from '../schema';

export const deletePantryItem = async (id: number): Promise<PantryItem> => {
  // Placeholder: would delete the pantry item from DB and return the deleted record
  return {
    id,
    name: 'Deleted Item',
    quantity: 0,
    unit: 'pcs',
    purchase_date: new Date(),
    expiry_date: new Date(),
    category: 'Other',
    created_at: new Date(),
  } as PantryItem;
};
