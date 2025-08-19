import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable } from '../db/schema';
import { getRecipesByAuthor } from '../handlers/get_recipes_by_author';

describe('getRecipesByAuthor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recipes by specific author in descending order by created_at', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { username: 'chef1', email: 'chef1@example.com' },
        { username: 'chef2', email: 'chef2@example.com' }
      ])
      .returning()
      .execute();

    const author1 = users[0];
    const author2 = users[1];

    // Create recipes with different timestamps
    const baseTime = new Date('2024-01-01T12:00:00Z');
    const laterTime = new Date('2024-01-02T12:00:00Z');

    await db.insert(recipesTable)
      .values([
        {
          title: 'First Recipe by Author 1',
          description: 'First recipe description',
          ingredients: ['flour', 'sugar'],
          instructions: ['mix ingredients', 'bake'],
          categories: ['dessert'],
          prep_time_minutes: 30,
          cook_time_minutes: 45,
          servings: 6,
          difficulty: 'easy',
          author_id: author1.id,
          created_at: baseTime
        },
        {
          title: 'Recipe by Author 2',
          description: 'Different author recipe',
          ingredients: ['chicken', 'spices'],
          instructions: ['season chicken', 'cook'],
          categories: ['dinner'],
          prep_time_minutes: 15,
          cook_time_minutes: 30,
          servings: 4,
          difficulty: 'medium',
          author_id: author2.id,
          created_at: baseTime
        },
        {
          title: 'Second Recipe by Author 1',
          description: 'Latest recipe',
          ingredients: ['pasta', 'sauce'],
          instructions: ['boil pasta', 'add sauce'],
          categories: ['lunch'],
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          servings: 2,
          difficulty: 'easy',
          author_id: author1.id,
          created_at: laterTime
        }
      ])
      .execute();

    const result = await getRecipesByAuthor(author1.id);

    // Should return 2 recipes for author1
    expect(result).toHaveLength(2);

    // Should be ordered by created_at descending (most recent first)
    expect(result[0].title).toEqual('Second Recipe by Author 1');
    expect(result[1].title).toEqual('First Recipe by Author 1');

    // Verify all fields are properly mapped
    expect(result[0].ingredients).toEqual(['pasta', 'sauce']);
    expect(result[0].instructions).toEqual(['boil pasta', 'add sauce']);
    expect(result[0].categories).toEqual(['lunch']);
    expect(result[0].author_id).toEqual(author1.id);
    expect(result[0].prep_time_minutes).toEqual(10);
    expect(result[0].cook_time_minutes).toEqual(20);
    expect(result[0].servings).toEqual(2);
    expect(result[0].difficulty).toEqual('easy');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for author with no recipes', async () => {
    // Create user but no recipes
    const user = await db.insert(usersTable)
      .values({ username: 'norecipes', email: 'norecipes@example.com' })
      .returning()
      .execute();

    const result = await getRecipesByAuthor(user[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent author', async () => {
    const result = await getRecipesByAuthor(999);

    expect(result).toHaveLength(0);
  });

  it('should handle recipes with nullable fields correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({ username: 'testchef', email: 'test@example.com' })
      .returning()
      .execute();

    // Create recipe with minimal required fields
    await db.insert(recipesTable)
      .values({
        title: 'Minimal Recipe',
        description: null,
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        categories: ['breakfast'],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        difficulty: null,
        author_id: user[0].id
      })
      .execute();

    const result = await getRecipesByAuthor(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Recipe');
    expect(result[0].description).toBeNull();
    expect(result[0].prep_time_minutes).toBeNull();
    expect(result[0].cook_time_minutes).toBeNull();
    expect(result[0].servings).toBeNull();
    expect(result[0].difficulty).toBeNull();
    expect(result[0].ingredients).toEqual(['ingredient1']);
    expect(result[0].instructions).toEqual(['step1']);
    expect(result[0].categories).toEqual(['breakfast']);
  });

  it('should handle multiple categories correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({ username: 'multicategory', email: 'multi@example.com' })
      .returning()
      .execute();

    // Create recipe with multiple categories
    await db.insert(recipesTable)
      .values({
        title: 'Multi-Category Recipe',
        description: 'Recipe with many categories',
        ingredients: ['veggies', 'herbs'],
        instructions: ['prep', 'cook', 'serve'],
        categories: ['vegetarian', 'healthy', 'lunch', 'dinner'],
        prep_time_minutes: 15,
        cook_time_minutes: 25,
        servings: 3,
        difficulty: 'medium',
        author_id: user[0].id
      })
      .execute();

    const result = await getRecipesByAuthor(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].categories).toEqual(['vegetarian', 'healthy', 'lunch', 'dinner']);
    expect(result[0].ingredients).toEqual(['veggies', 'herbs']);
    expect(result[0].instructions).toEqual(['prep', 'cook', 'serve']);
  });
});
