import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable, reviewsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateReviewInput, type CreateProductInput, type CreateCategoryInput } from '../schema';
import { createReview, getReviews, updateReview } from '../handlers/create_review';

// Helper functions to create prerequisite data
const createCategory = async (input: CreateCategoryInput) => {
  const result = await db.insert(categoriesTable).values({ name: input.name }).returning().execute();
  return result[0];
};

const createProduct = async (input: CreateProductInput) => {
  const result = await db.insert(productsTable).values({
    name: input.name,
    category_id: input.category_id,
    image_url: input.image_url ?? null,
    price: input.price.toString(),
    specifications: input.specifications ?? null,
  }).returning().execute();
  return result[0];
};

describe('Review handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a review for an existing product', async () => {
    // Setup category and product
    const category = await createCategory({ name: 'Gadgets' });
    const product = await createProduct({
      name: 'Super Widget',
      category_id: category.id,
      price: 49.99,
    } as any);

    const reviewInput: CreateReviewInput = {
      product_id: product.id,
      title: 'Great product',
      content: 'I love it',
      rating: 5,
      pros: ['Fast', 'Compact'],
      cons: ['Expensive'],
    };

    const review = await createReview(reviewInput);
    expect(review.id).toBeDefined();
    expect(review.product_id).toBe(product.id);
    expect(review.title).toBe(reviewInput.title);
    expect(review.rating).toBe(5);
    expect(review.pros).toEqual(['Fast', 'Compact']);
    expect(review.created_at).toBeInstanceOf(Date);
  });

  it('should retrieve all reviews', async () => {
    const category = await createCategory({ name: 'Tools' });
    const product = await createProduct({
      name: 'Hammer',
      category_id: category.id,
      price: 19.99,
    } as any);

    const reviewInput: CreateReviewInput = {
      product_id: product.id,
      title: 'Sturdy',
      content: 'Works well',
      rating: 4,
      pros: ['Durable'],
      cons: ['Heavy'],
    };

    await createReview(reviewInput);
    const all = await getReviews();
    expect(all.length).toBeGreaterThanOrEqual(1);
    const fetched = all.find(r => r.title === 'Sturdy');
    expect(fetched).toBeDefined();
    expect(fetched?.product_id).toBe(product.id);
  });

  it('should update an existing review', async () => {
    const category = await createCategory({ name: 'Audio' });
    const product = await createProduct({
      name: 'Headphones',
      category_id: category.id,
      price: 99.99,
    } as any);

    const reviewInput: CreateReviewInput = {
      product_id: product.id,
      title: 'Good',
      content: 'Nice sound',
      rating: 3,
      pros: ['Bass'],
      cons: ['Pricey'],
    };

    const created = await createReview(reviewInput);

    const updated = await updateReview({
      id: created.id,
      rating: 4,
      title: 'Very Good',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.rating).toBe(4);
    expect(updated.title).toBe('Very Good');
    // unchanged fields remain the same
    expect(updated.pros).toEqual(['Bass']);
  });
});
