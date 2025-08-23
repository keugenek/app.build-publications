import { type CreateProductInput, type Product } from '../schema';

/**
 * Placeholder handler for creating a product.
 * In a real implementation this would insert the product into the database
 * and return the created product with its generated ID and timestamps.
 */
export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  return {
    id: 0, // placeholder ID
    name: input.name,
    sku: input.sku,
    stock_quantity: input.stock_quantity ?? 0,
    created_at: new Date(),
  } as Product;
};
