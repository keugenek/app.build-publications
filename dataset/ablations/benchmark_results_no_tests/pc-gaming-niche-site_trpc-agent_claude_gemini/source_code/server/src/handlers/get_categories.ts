import { type ProductCategory, productCategorySchema } from '../schema';

export const getCategories = async (): Promise<ProductCategory[]> => {
  try {
    // Return all available product categories from the schema enum
    // This provides a single source of truth for available categories
    const categories: ProductCategory[] = productCategorySchema.options;
    
    return categories;
  } catch (error) {
    console.error('Failed to get categories:', error);
    throw error;
  }
};
