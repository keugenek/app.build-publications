import { type CreateProductInput, type UpdateProductInput, type Product } from '../schema';

// Placeholder handler for creating a product
export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  return {
    id: 0,
    name: input.name,
    category_id: input.category_id,
    image_url: input.image_url ?? null,
    price: input.price,
    specifications: input.specifications ?? null,
    created_at: new Date(),
  } as Product;
};

// Placeholder handler for fetching all products
export const getProducts = async (): Promise<Product[]> => {
  return [];
};

// Placeholder handler for updating a product
export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  return {
    id: input.id,
    name: input.name ?? 'Updated Product',
    category_id: input.category_id ?? 0,
    image_url: input.image_url ?? null,
    price: input.price ?? 0,
    specifications: input.specifications ?? null,
    created_at: new Date(),
  } as Product;
};
