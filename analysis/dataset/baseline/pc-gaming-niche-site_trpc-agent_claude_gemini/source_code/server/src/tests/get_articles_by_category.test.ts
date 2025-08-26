import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticlesByCategoryInput, type CreateArticleInput } from '../schema';
import { getArticlesByCategory } from '../handlers/get_articles_by_category';

// Test data for different categories
const mouseArticle: CreateArticleInput = {
  product_name: 'Logitech MX Master 3S',
  category: 'mice',
  price: 99.99,
  overall_rating: 4.5,
  short_description: 'Premium wireless mouse for productivity',
  detailed_review: 'The Logitech MX Master 3S is an excellent mouse for productivity work...',
  pros: ['Excellent ergonomics', 'Long battery life', 'Precise tracking'],
  cons: ['Heavy weight', 'Expensive price point'],
  main_image_url: 'https://example.com/mx-master-3s.jpg'
};

const keyboardArticle: CreateArticleInput = {
  product_name: 'Mechanical Keyboard Pro',
  category: 'keyboards',
  price: 149.99,
  overall_rating: 4.2,
  short_description: 'Professional mechanical keyboard',
  detailed_review: 'This mechanical keyboard offers great typing experience...',
  pros: ['Tactile switches', 'Durable build quality'],
  cons: ['Loud typing', 'No wireless option'],
  main_image_url: null
};

const headsetArticle: CreateArticleInput = {
  product_name: 'Gaming Headset Ultra',
  category: 'headsets',
  price: 79.95,
  overall_rating: 3.8,
  short_description: 'Affordable gaming headset',
  detailed_review: 'Good value gaming headset with decent sound quality...',
  pros: ['Comfortable padding', 'Clear microphone'],
  cons: ['Plastic build', 'Limited sound isolation'],
  main_image_url: 'https://example.com/gaming-headset.jpg'
};

const createTestArticle = async (input: CreateArticleInput) => {
  const result = await db.insert(articlesTable)
    .values({
      product_name: input.product_name,
      category: input.category,
      price: input.price.toString(), // Convert number to string for numeric column
      overall_rating: input.overall_rating.toString(), // Convert number to string for numeric column
      short_description: input.short_description,
      detailed_review: input.detailed_review,
      pros: input.pros,
      cons: input.cons,
      main_image_url: input.main_image_url
    })
    .returning()
    .execute();

  return result[0];
};

describe('getArticlesByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return articles filtered by mice category', async () => {
    // Create test articles in different categories
    await createTestArticle(mouseArticle);
    await createTestArticle(keyboardArticle);
    await createTestArticle(headsetArticle);

    const input: GetArticlesByCategoryInput = {
      category: 'mice'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].product_name).toEqual('Logitech MX Master 3S');
    expect(result[0].category).toEqual('mice');
    expect(result[0].price).toEqual(99.99);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].overall_rating).toEqual(4.5);
    expect(typeof result[0].overall_rating).toBe('number');
  });

  it('should return articles filtered by keyboards category', async () => {
    // Create test articles
    await createTestArticle(mouseArticle);
    await createTestArticle(keyboardArticle);

    const input: GetArticlesByCategoryInput = {
      category: 'keyboards'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].product_name).toEqual('Mechanical Keyboard Pro');
    expect(result[0].category).toEqual('keyboards');
    expect(result[0].price).toEqual(149.99);
    expect(result[0].main_image_url).toBeNull();
  });

  it('should return articles filtered by headsets category', async () => {
    // Create test articles
    await createTestArticle(headsetArticle);
    await createTestArticle(keyboardArticle);

    const input: GetArticlesByCategoryInput = {
      category: 'headsets'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].product_name).toEqual('Gaming Headset Ultra');
    expect(result[0].category).toEqual('headsets');
    expect(result[0].price).toEqual(79.95);
    expect(result[0].overall_rating).toEqual(3.8);
  });

  it('should return empty array when no articles exist for category', async () => {
    // Create articles in other categories but not the one we're searching for
    await createTestArticle(keyboardArticle);
    await createTestArticle(headsetArticle);

    const input: GetArticlesByCategoryInput = {
      category: 'mice'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(0);
  });

  it('should return articles ordered by creation date (newest first)', async () => {
    // Create first article
    await createTestArticle(mouseArticle);
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Create second article with same category
    const secondMouseArticle: CreateArticleInput = {
      ...mouseArticle,
      product_name: 'Razer Gaming Mouse',
      price: 69.99,
      overall_rating: 4.0
    };
    await createTestArticle(secondMouseArticle);

    const input: GetArticlesByCategoryInput = {
      category: 'mice'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(2);
    // Newest article should be first (Razer Gaming Mouse was created last)
    expect(result[0].product_name).toEqual('Razer Gaming Mouse');
    expect(result[1].product_name).toEqual('Logitech MX Master 3S');
    
    // Verify timestamps are ordered correctly (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle all fields correctly including arrays and nullable fields', async () => {
    await createTestArticle(mouseArticle);

    const input: GetArticlesByCategoryInput = {
      category: 'mice'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(1);
    const article = result[0];
    
    // Verify all basic fields
    expect(article.id).toBeDefined();
    expect(article.product_name).toEqual('Logitech MX Master 3S');
    expect(article.category).toEqual('mice');
    expect(article.short_description).toEqual('Premium wireless mouse for productivity');
    expect(article.detailed_review).toEqual('The Logitech MX Master 3S is an excellent mouse for productivity work...');
    expect(article.main_image_url).toEqual('https://example.com/mx-master-3s.jpg');
    
    // Verify numeric conversions
    expect(article.price).toEqual(99.99);
    expect(typeof article.price).toBe('number');
    expect(article.overall_rating).toEqual(4.5);
    expect(typeof article.overall_rating).toBe('number');
    
    // Verify JSON array fields
    expect(Array.isArray(article.pros)).toBe(true);
    expect(article.pros).toEqual(['Excellent ergonomics', 'Long battery life', 'Precise tracking']);
    expect(Array.isArray(article.cons)).toBe(true);
    expect(article.cons).toEqual(['Heavy weight', 'Expensive price point']);
    
    // Verify timestamps
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
  });

  it('should handle articles with null main_image_url', async () => {
    await createTestArticle(keyboardArticle); // This has null main_image_url

    const input: GetArticlesByCategoryInput = {
      category: 'keyboards'
    };

    const result = await getArticlesByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].main_image_url).toBeNull();
  });
});
