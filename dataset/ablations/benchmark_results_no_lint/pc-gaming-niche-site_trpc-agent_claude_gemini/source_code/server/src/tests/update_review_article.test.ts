import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type UpdateReviewArticleInput, type CreateReviewArticleInput } from '../schema';
import { updateReviewArticle } from '../handlers/update_review_article';
import { eq } from 'drizzle-orm';

// Helper function to create a test review article
async function createTestReviewArticle(overrides: Partial<CreateReviewArticleInput> = {}) {
  const testData = {
    product_name: 'Gaming Mouse Pro',
    brand: 'TechBrand',
    category: 'mice' as const,
    star_rating: 4,
    price_range: '50_100' as const,
    pros: ['Great ergonomics', 'Responsive clicks'],
    cons: ['Bit expensive', 'Heavy'],
    review_body: 'This is a comprehensive review of the gaming mouse with detailed analysis of its features and performance.',
    published: false,
    ...overrides
  };

  const slug = `${testData.product_name}-${testData.brand}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const result = await db.insert(reviewArticlesTable)
    .values({
      ...testData,
      slug,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0];
}

describe('updateReviewArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a review article with partial data', async () => {
    // Create initial record
    const initialRecord = await createTestReviewArticle();
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      star_rating: 5,
      published: true
    };

    const result = await updateReviewArticle(updateInput);

    // Verify updated fields
    expect(result.star_rating).toEqual(5);
    expect(result.published).toEqual(true);
    
    // Verify unchanged fields
    expect(result.product_name).toEqual('Gaming Mouse Pro');
    expect(result.brand).toEqual('TechBrand');
    expect(result.category).toEqual('mice');
    expect(result.price_range).toEqual('50_100');
    expect(result.pros).toEqual(['Great ergonomics', 'Responsive clicks']);
    expect(result.cons).toEqual(['Bit expensive', 'Heavy']);
    
    // Verify timestamp was updated
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialRecord.updated_at.getTime());
    
    // Verify created_at wasn't changed
    expect(result.created_at.getTime()).toEqual(initialRecord.created_at.getTime());
  });

  it('should regenerate slug when product name changes', async () => {
    const initialRecord = await createTestReviewArticle();
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      product_name: 'Super Gaming Mouse'
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.product_name).toEqual('Super Gaming Mouse');
    expect(result.slug).toEqual('super-gaming-mouse-techbrand');
    expect(result.slug).not.toEqual(initialRecord.slug);
  });

  it('should regenerate slug when brand changes', async () => {
    const initialRecord = await createTestReviewArticle();
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      brand: 'NewBrand'
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.brand).toEqual('NewBrand');
    expect(result.slug).toEqual('gaming-mouse-pro-newbrand');
    expect(result.slug).not.toEqual(initialRecord.slug);
  });

  it('should regenerate slug when both product name and brand change', async () => {
    const initialRecord = await createTestReviewArticle();
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      product_name: 'Elite Mouse',
      brand: 'ProBrand'
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.product_name).toEqual('Elite Mouse');
    expect(result.brand).toEqual('ProBrand');
    expect(result.slug).toEqual('elite-mouse-probrand');
  });

  it('should not regenerate slug when other fields change', async () => {
    const initialRecord = await createTestReviewArticle();
    const originalSlug = initialRecord.slug;
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      star_rating: 3,
      category: 'keyboards',
      published: true
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.slug).toEqual(originalSlug);
    expect(result.star_rating).toEqual(3);
    expect(result.category).toEqual('keyboards');
    expect(result.published).toEqual(true);
  });

  it('should update arrays (pros and cons)', async () => {
    const initialRecord = await createTestReviewArticle();
    
    const newPros = ['Excellent precision', 'Comfortable grip', 'Durable build'];
    const newCons = ['Noisy clicks'];
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      pros: newPros,
      cons: newCons
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.pros).toEqual(newPros);
    expect(result.cons).toEqual(newCons);
    expect(Array.isArray(result.pros)).toBe(true);
    expect(Array.isArray(result.cons)).toBe(true);
  });

  it('should save updated data to database', async () => {
    const initialRecord = await createTestReviewArticle();
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      product_name: 'Updated Mouse',
      star_rating: 2,
      published: true
    };

    await updateReviewArticle(updateInput);

    // Query database to verify changes were persisted
    const dbRecord = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, initialRecord.id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    const record = dbRecord[0];
    
    expect(record.product_name).toEqual('Updated Mouse');
    expect(record.star_rating).toEqual(2);
    expect(record.published).toEqual(true);
    expect(record.slug).toEqual('updated-mouse-techbrand');
  });

  it('should update all updatable fields at once', async () => {
    const initialRecord = await createTestReviewArticle();
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      product_name: 'Complete Update Mouse',
      brand: 'UpdatedBrand',
      category: 'headsets',
      star_rating: 1,
      price_range: '100_plus',
      pros: ['New pro'],
      cons: ['New con'],
      review_body: 'This is a completely updated review body that meets the minimum length requirement for validation.',
      published: true
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.product_name).toEqual('Complete Update Mouse');
    expect(result.brand).toEqual('UpdatedBrand');
    expect(result.category).toEqual('headsets');
    expect(result.star_rating).toEqual(1);
    expect(result.price_range).toEqual('100_plus');
    expect(result.pros).toEqual(['New pro']);
    expect(result.cons).toEqual(['New con']);
    expect(result.review_body).toEqual('This is a completely updated review body that meets the minimum length requirement for validation.');
    expect(result.published).toEqual(true);
    expect(result.slug).toEqual('complete-update-mouse-updatedbrand');
  });

  it('should throw error when review article does not exist', async () => {
    const updateInput: UpdateReviewArticleInput = {
      id: 99999, // Non-existent ID
      star_rating: 5
    };

    await expect(updateReviewArticle(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle slug generation with special characters', async () => {
    const initialRecord = await createTestReviewArticle({
      product_name: 'Test Mouse!',
      brand: 'Brand & Co.'
    });
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      product_name: 'New Mouse @2024!',
      brand: 'Tech & Gaming Co.'
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.slug).toEqual('new-mouse-2024-tech-gaming-co');
    expect(result.slug).not.toContain('!');
    expect(result.slug).not.toContain('@');
    expect(result.slug).not.toContain('&');
  });

  it('should preserve original created_at timestamp', async () => {
    const initialRecord = await createTestReviewArticle();
    const originalCreatedAt = initialRecord.created_at;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateReviewArticleInput = {
      id: initialRecord.id,
      star_rating: 3
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });
});
