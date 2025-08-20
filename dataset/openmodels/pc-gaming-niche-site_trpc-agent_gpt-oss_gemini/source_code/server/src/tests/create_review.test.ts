import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewsTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

// Helper to create a category for FK
const createCategory = async (name: string) => {
  const result = await db
    .insert(categoriesTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

const testInputBase = {
  title: 'Great Phone',
  brand: 'PhoneCo',
  model: 'X100',
  rating: 5,
  summary: 'Excellent device',
  body: 'I love this phone because ...',
};

describe('createReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a review and return all fields', async () => {
    const category = await createCategory('Phones');
    const input: CreateReviewInput = {
      ...testInputBase,
      category_id: category.id,
    };

    const result = await createReview(input);

    // Validate returned object
    expect(result.id).toBeDefined();
    expect(result.title).toBe(input.title);
    expect(result.brand).toBe(input.brand);
    expect(result.model).toBe(input.model);
    expect(result.rating).toBe(input.rating);
    expect(result.summary).toBe(input.summary);
    expect(result.body).toBe(input.body);
    expect(result.category_id).toBe(category.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the review in the database', async () => {
    const category = await createCategory('Laptops');
    const input: CreateReviewInput = {
      ...testInputBase,
      title: 'Super Laptop',
      brand: 'LaptopCorp',
      model: 'Pro15',
      rating: 4,
      summary: 'Solid performance',
      body: 'Battery life could be better...',
      category_id: category.id,
    };

    const created = await createReview(input);

    const rows = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.title).toBe(input.title);
    expect(row.brand).toBe(input.brand);
    expect(row.model).toBe(input.model);
    expect(row.rating).toBe(input.rating);
    expect(row.summary).toBe(input.summary);
    expect(row.body).toBe(input.body);
    expect(row.category_id).toBe(category.id);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
