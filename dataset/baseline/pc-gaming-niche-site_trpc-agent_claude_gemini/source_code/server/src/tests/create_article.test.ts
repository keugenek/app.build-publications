import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { createArticle } from '../handlers/create_article';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateArticleInput = {
  product_name: 'Logitech MX Master 3S',
  category: 'mice' as const,
  price: 99.99,
  overall_rating: 4.5,
  short_description: 'Premium wireless mouse for productivity',
  detailed_review: 'The Logitech MX Master 3S is an excellent choice for professionals who need precise control and comfort during long work sessions.',
  pros: ['Ergonomic design', 'Long battery life', 'Precise tracking'],
  cons: ['Expensive', 'Heavy for some users'],
  main_image_url: 'https://example.com/mouse-image.jpg'
};

describe('createArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an article with all fields', async () => {
    const result = await createArticle(testInput);

    // Basic field validation
    expect(result.product_name).toEqual('Logitech MX Master 3S');
    expect(result.category).toEqual('mice');
    expect(result.price).toEqual(99.99);
    expect(typeof result.price).toBe('number'); // Verify numeric conversion
    expect(result.overall_rating).toEqual(4.5);
    expect(typeof result.overall_rating).toBe('number'); // Verify numeric conversion
    expect(result.short_description).toEqual('Premium wireless mouse for productivity');
    expect(result.detailed_review).toContain('Logitech MX Master 3S');
    expect(result.pros).toEqual(['Ergonomic design', 'Long battery life', 'Precise tracking']);
    expect(result.cons).toEqual(['Expensive', 'Heavy for some users']);
    expect(result.main_image_url).toEqual('https://example.com/mouse-image.jpg');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save article to database correctly', async () => {
    const result = await createArticle(testInput);

    // Query the database to verify data was saved
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    const savedArticle = articles[0];
    expect(savedArticle.product_name).toEqual('Logitech MX Master 3S');
    expect(savedArticle.category).toEqual('mice');
    expect(parseFloat(savedArticle.price)).toEqual(99.99); // Convert from stored string
    expect(parseFloat(savedArticle.overall_rating)).toEqual(4.5); // Convert from stored string
    expect(savedArticle.pros).toEqual(['Ergonomic design', 'Long battery life', 'Precise tracking']);
    expect(savedArticle.cons).toEqual(['Expensive', 'Heavy for some users']);
    expect(savedArticle.main_image_url).toEqual('https://example.com/mouse-image.jpg');
    expect(savedArticle.created_at).toBeInstanceOf(Date);
    expect(savedArticle.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null main_image_url', async () => {
    const inputWithoutImage: CreateArticleInput = {
      ...testInput,
      main_image_url: null
    };

    const result = await createArticle(inputWithoutImage);

    expect(result.main_image_url).toBeNull();

    // Verify in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles[0].main_image_url).toBeNull();
  });

  it('should create keyboard category article', async () => {
    const keyboardInput: CreateArticleInput = {
      product_name: 'Keychron K6 Pro',
      category: 'keyboards' as const,
      price: 149.99,
      overall_rating: 4.0,
      short_description: 'Compact mechanical keyboard',
      detailed_review: 'Great mechanical keyboard with hot-swappable switches.',
      pros: ['Hot-swappable switches', 'Compact design'],
      cons: ['No number pad', 'Expensive switches'],
      main_image_url: 'https://example.com/keyboard.jpg'
    };

    const result = await createArticle(keyboardInput);

    expect(result.category).toEqual('keyboards');
    expect(result.product_name).toEqual('Keychron K6 Pro');
    expect(result.price).toEqual(149.99);
    expect(result.overall_rating).toEqual(4.0);
  });

  it('should create headsets category article', async () => {
    const headsetInput: CreateArticleInput = {
      product_name: 'SteelSeries Arctis 7P',
      category: 'headsets' as const,
      price: 179.99,
      overall_rating: 3.5,
      short_description: 'Wireless gaming headset',
      detailed_review: 'Solid wireless headset with good audio quality for gaming.',
      pros: ['Wireless connectivity', 'Good audio quality', 'Comfortable fit'],
      cons: ['Battery life could be better', 'Mic quality average'],
      main_image_url: 'https://example.com/headset.jpg'
    };

    const result = await createArticle(headsetInput);

    expect(result.category).toEqual('headsets');
    expect(result.product_name).toEqual('SteelSeries Arctis 7P');
    expect(result.price).toEqual(179.99);
    expect(result.overall_rating).toEqual(3.5);
  });

  it('should handle decimal ratings correctly', async () => {
    const inputWithDecimalRating: CreateArticleInput = {
      ...testInput,
      overall_rating: 3.7
    };

    const result = await createArticle(inputWithDecimalRating);

    expect(result.overall_rating).toEqual(3.7);
    expect(typeof result.overall_rating).toBe('number');

    // Verify precision is maintained in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(parseFloat(articles[0].overall_rating)).toEqual(3.7);
  });

  it('should handle high precision prices correctly', async () => {
    const inputWithPrecisePrice: CreateArticleInput = {
      ...testInput,
      price: 123.45
    };

    const result = await createArticle(inputWithPrecisePrice);

    expect(result.price).toEqual(123.45);
    expect(typeof result.price).toBe('number');

    // Verify precision is maintained in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(parseFloat(articles[0].price)).toEqual(123.45);
  });
});
