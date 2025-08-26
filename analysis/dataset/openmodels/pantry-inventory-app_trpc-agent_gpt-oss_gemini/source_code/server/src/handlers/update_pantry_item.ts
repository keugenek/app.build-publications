import { type UpdatePantryItemInput, type PantryItem } from '../schema';

export const updatePantryItem = async (input: UpdatePantryItemInput): Promise<PantryItem> => {
  // Placeholder: would update the pantry item in DB and return the updated record
  // For now, return a mock object merging defaults
  return {
    id: input.id,
    name: input.name ?? 'Unnamed',
    quantity: input.quantity ?? 1,
    unit: input.unit ?? 'pcs',
    purchase_date: input.purchase_date ?? new Date(),
    expiry_date: input.expiry_date ?? new Date(),
    category: input.category ?? 'Other',
    created_at: new Date(),
  } as PantryItem;
};
