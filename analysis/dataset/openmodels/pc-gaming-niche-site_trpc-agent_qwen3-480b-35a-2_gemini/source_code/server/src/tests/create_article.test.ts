import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { createArticle } from '../handlers/create_article';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateArticleInput = {
  title: 'Test Article',
  slug: 'test-article',
  content: 'This is a test article content',
  excerpt: 'A short excerpt',
  image_url: 'https://example.com/image.jpg',
  published: true
};

describe('createArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an article', async () => {
    const result = await createArticle(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Article');
    expect(result.slug).toEqual('test-article');
    expect(result.content).toEqual('This is a test article content');
    expect(result.excerpt).toEqual('A short excerpt');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save article to database', async () => {
    const result = await createArticle(testInput);

    // Query using proper drizzle syntax
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toEqual('Test Article');
    expect(articles[0].slug).toEqual('test-article');
    expect(articles[0].content).toEqual('This is a test article content');
    expect(articles[0].excerpt).toEqual('A short excerpt');
    expect(articles[0].image_url).toEqual('https://example.com/image.jpg');
    expect(articles[0].published).toEqual(true);
    expect(articles[0].created_at).toBeInstanceOf(Date);
    expect(articles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create article with nullable fields as null', async () => {
    const inputWithoutOptional: CreateArticleInput = {
      title: 'Test Article 2',
      slug: 'test-article-2',
      content: 'This is another test article content',
      excerpt: null,
      image_url: null,
      published: false
    };

    const result = await createArticle(inputWithoutOptional);

    expect(result.title).toEqual('Test Article 2');
    expect(result.excerpt).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.published).toEqual(false);
  });
});
