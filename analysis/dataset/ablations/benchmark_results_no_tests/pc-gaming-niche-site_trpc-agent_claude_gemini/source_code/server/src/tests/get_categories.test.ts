import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getCategories } from '../handlers/get_categories';
import { type ProductCategory } from '../schema';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all available product categories', async () => {
    const result = await getCategories();

    // Verify all expected categories are returned
    const expectedCategories: ProductCategory[] = [
      'mice', 
      'keyboards', 
      'headsets', 
      'mousepads', 
      'controllers'
    ];

    expect(result).toHaveLength(5);
    expect(result).toEqual(expectedCategories);
  });

  it('should return categories in consistent order', async () => {
    const result1 = await getCategories();
    const result2 = await getCategories();

    // Categories should be returned in the same order each time
    expect(result1).toEqual(result2);
  });

  it('should return array of strings', async () => {
    const result = await getCategories();

    // Verify each category is a string
    result.forEach(category => {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });
  });

  it('should contain expected specific categories', async () => {
    const result = await getCategories();

    // Test for specific categories that should always be present
    expect(result).toContain('mice');
    expect(result).toContain('keyboards');
    expect(result).toContain('headsets');
    expect(result).toContain('mousepads');
    expect(result).toContain('controllers');
  });

  it('should not contain invalid categories', async () => {
    const result = await getCategories();

    // Ensure no invalid categories are present
    const invalidCategories = ['laptops', 'monitors', 'speakers', 'webcams'];
    
    invalidCategories.forEach(invalidCategory => {
      expect(result).not.toContain(invalidCategory);
    });
  });

  it('should be suitable for frontend dropdown menus', async () => {
    const result = await getCategories();

    // Verify structure is suitable for UI components
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Each category should be a non-empty string (suitable for display)
    result.forEach(category => {
      expect(typeof category).toBe('string');
      expect(category.trim()).toBe(category); // No leading/trailing whitespace
      expect(category.length).toBeGreaterThan(0);
    });
  });
});
