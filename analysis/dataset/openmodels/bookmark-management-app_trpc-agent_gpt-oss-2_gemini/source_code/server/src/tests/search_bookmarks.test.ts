import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { bookmarks } from '../db/schema';
import { searchBookmarks } from '../handlers/search_bookmarks';

describe('searchBookmarks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns matching bookmarks based on title, url, or description', async () => {
    // Insert test data
    const testData = [
      {
        url: 'https://example.com/first',
        title: 'First Bookmark',
        description: 'A simple first item',
        user_id: null,
      },
      {
        url: 'https://example.com/second',
        title: 'Second Bookmark',
        description: 'Contains the word test',
        user_id: null,
      },
      {
        url: 'https://testsite.org',
        title: 'Third',
        description: null,
        user_id: null,
      },
    ];

    await db.insert(bookmarks).values(testData).execute();

    // Search for term present in description of second bookmark
    const resultsDesc = await searchBookmarks('test');
    expect(resultsDesc).toHaveLength(2);
    const titlesDesc = resultsDesc.map(r => r.title);
    expect(titlesDesc).toContain('Second Bookmark');
    expect(titlesDesc).toContain('Third');

    // Search for term present in URL of third bookmark
    const resultsUrl = await searchBookmarks('testsite');
    expect(resultsUrl).toHaveLength(1);
    expect(resultsUrl[0].title).toBe('Third');
  });

  it('returns empty array for empty query', async () => {
    const result = await searchBookmarks('');
    expect(result).toEqual([]);
  });
});
