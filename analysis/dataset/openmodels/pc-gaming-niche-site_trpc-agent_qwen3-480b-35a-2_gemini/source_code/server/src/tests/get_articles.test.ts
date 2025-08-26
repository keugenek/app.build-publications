import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { getArticles, getPublishedArticles, getArticleBySlug } from '../handlers/get_articles';

describe('getArticles', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(articlesTable).values([
      {
        title: 'First Article',
        slug: 'first-article',
        content: 'This is the first article content',
        excerpt: 'First article excerpt',
        published: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Second Article',
        slug: 'second-article',
        content: 'This is the second article content',
        excerpt: 'Second article excerpt',
        published: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Third Article',
        slug: 'third-article',
        content: 'This is the third article content',
        published: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all articles', async () => {
    const articles = await getArticles();
    
    expect(articles).toHaveLength(3);
    expect(articles[0].title).toBe('First Article');
    expect(articles[1].title).toBe('Second Article');
    expect(articles[2].title).toBe('Third Article');
    
    // Check that dates are properly handled
    expect(articles[0].created_at).toBeInstanceOf(Date);
    expect(articles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fetch only published articles', async () => {
    const articles = await getPublishedArticles();
    
    expect(articles).toHaveLength(2);
    
    // Should only return published articles
    articles.forEach(article => {
      expect(article.published).toBe(true);
    });
    
    // Check specific titles
    const titles = articles.map(article => article.title);
    expect(titles).toContain('First Article');
    expect(titles).toContain('Third Article');
    expect(titles).not.toContain('Second Article');
  });

  it('should fetch article by slug', async () => {
    const article = await getArticleBySlug('first-article');
    
    expect(article).not.toBeNull();
    expect(article?.title).toBe('First Article');
    expect(article?.slug).toBe('first-article');
    expect(article?.published).toBe(true);
    expect(article?.created_at).toBeInstanceOf(Date);
    expect(article?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent slug', async () => {
    const article = await getArticleBySlug('non-existent-slug');
    
    expect(article).toBeNull();
  });
});
