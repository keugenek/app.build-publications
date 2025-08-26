import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type CreateReviewArticleInput } from '../schema';
import { createReviewArticle } from '../handlers/create_review_article';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateReviewArticleInput = {
  product_name: 'MX Master 3S',
  brand: 'Logitech',
  category: 'mice' as const,
  star_rating: 4,
  price_range: '50_100' as const,
  pros: ['Excellent ergonomics', 'Great battery life', 'Smooth scrolling'],
  cons: ['Heavy weight', 'Expensive'],
  review_body: 'The Logitech MX Master 3S is an excellent productivity mouse that offers outstanding comfort and precision. Its ergonomic design makes it perfect for long work sessions, while the advanced tracking technology ensures smooth cursor movement on any surface.',
  published: true
};

describe('createReviewArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a review article with all fields', async () => {
    const result = await createReviewArticle(testInput);

    // Verify all basic fields
    expect(result.product_name).toEqual('MX Master 3S');
    expect(result.brand).toEqual('Logitech');
    expect(result.category).toEqual('mice');
    expect(result.star_rating).toEqual(4);
    expect(result.price_range).toEqual('50_100');
    expect(result.pros).toEqual(['Excellent ergonomics', 'Great battery life', 'Smooth scrolling']);
    expect(result.cons).toEqual(['Heavy weight', 'Expensive']);
    expect(result.review_body).toEqual(testInput.review_body);
    expect(result.published).toEqual(true);
    
    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.slug).toEqual('logitech-mx-master-3s');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save review article to database correctly', async () => {
    const result = await createReviewArticle(testInput);

    // Query the database to verify the record was saved
    const reviews = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    const savedReview = reviews[0];
    
    expect(savedReview.product_name).toEqual('MX Master 3S');
    expect(savedReview.brand).toEqual('Logitech');
    expect(savedReview.category).toEqual('mice');
    expect(savedReview.star_rating).toEqual(4);
    expect(savedReview.price_range).toEqual('50_100');
    expect(savedReview.pros).toEqual(['Excellent ergonomics', 'Great battery life', 'Smooth scrolling']);
    expect(savedReview.cons).toEqual(['Heavy weight', 'Expensive']);
    expect(savedReview.slug).toEqual('logitech-mx-master-3s');
    expect(savedReview.published).toEqual(true);
    expect(savedReview.created_at).toBeInstanceOf(Date);
    expect(savedReview.updated_at).toBeInstanceOf(Date);
  });

  it('should generate proper slug from brand and product name', async () => {
    const specialCharsInput: CreateReviewArticleInput = {
      ...testInput,
      product_name: 'G Pro X Superlight',
      brand: 'Logitech G',
    };

    const result = await createReviewArticle(specialCharsInput);
    expect(result.slug).toEqual('logitech-g-g-pro-x-superlight');
  });

  it('should handle special characters in slug generation', async () => {
    const specialCharsInput: CreateReviewArticleInput = {
      ...testInput,
      product_name: 'Model O- (Minus)',
      brand: 'Glorious PC Gaming Race',
    };

    const result = await createReviewArticle(specialCharsInput);
    expect(result.slug).toEqual('glorious-pc-gaming-race-model-o-minus');
  });

  it('should create unique slugs when duplicates exist', async () => {
    // Create first review article
    const firstResult = await createReviewArticle(testInput);
    expect(firstResult.slug).toEqual('logitech-mx-master-3s');

    // Create second review article with same product/brand
    const secondResult = await createReviewArticle(testInput);
    expect(secondResult.slug).toEqual('logitech-mx-master-3s-1');

    // Create third review article with same product/brand
    const thirdResult = await createReviewArticle(testInput);
    expect(thirdResult.slug).toEqual('logitech-mx-master-3s-2');

    // Verify all three have different IDs and slugs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.id).not.toEqual(thirdResult.id);
    expect(secondResult.id).not.toEqual(thirdResult.id);
  });

  it('should create unpublished review by default', async () => {
    const unpublishedInput: CreateReviewArticleInput = {
      ...testInput,
      published: false
    };

    const result = await createReviewArticle(unpublishedInput);
    expect(result.published).toEqual(false);
  });

  it('should handle different categories correctly', async () => {
    const keyboardInput: CreateReviewArticleInput = {
      ...testInput,
      product_name: 'MX Keys',
      category: 'keyboards' as const,
      pros: ['Quiet keys', 'Backlit'],
      cons: ['Membrane switches']
    };

    const result = await createReviewArticle(keyboardInput);
    expect(result.category).toEqual('keyboards');
    expect(result.slug).toEqual('logitech-mx-keys');
  });

  it('should handle different price ranges correctly', async () => {
    const budgetInput: CreateReviewArticleInput = {
      ...testInput,
      product_name: 'G203',
      price_range: 'under_25' as const
    };

    const result = await createReviewArticle(budgetInput);
    expect(result.price_range).toEqual('under_25');
  });

  it('should handle different star ratings correctly', async () => {
    const perfectRatingInput: CreateReviewArticleInput = {
      ...testInput,
      star_rating: 5
    };

    const result = await createReviewArticle(perfectRatingInput);
    expect(result.star_rating).toEqual(5);
  });

  it('should handle minimum and maximum pros/cons arrays', async () => {
    const minimalInput: CreateReviewArticleInput = {
      ...testInput,
      pros: ['One good thing'],
      cons: ['One bad thing']
    };

    const result = await createReviewArticle(minimalInput);
    expect(result.pros).toEqual(['One good thing']);
    expect(result.cons).toEqual(['One bad thing']);
  });

  it('should preserve JSON array structure for pros and cons', async () => {
    const result = await createReviewArticle(testInput);

    // Verify pros and cons are proper arrays
    expect(Array.isArray(result.pros)).toBe(true);
    expect(Array.isArray(result.cons)).toBe(true);
    expect(result.pros.length).toEqual(3);
    expect(result.cons.length).toEqual(2);
    
    // Check individual items
    expect(result.pros[0]).toEqual('Excellent ergonomics');
    expect(result.cons[0]).toEqual('Heavy weight');
  });
});
