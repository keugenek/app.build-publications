import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable, categoriesTable, recipeCategoriesTable } from '../db/schema';
import { type SearchRecipesInput } from '../schema';
import { searchRecipes } from '../handlers/search_recipes';
import { eq } from 'drizzle-orm';

describe('searchRecipes', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create some test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Breakfast' },
        { name: 'Lunch' },
        { name: 'Dinner' },
        { name: 'Dessert' },
      ])
      .returning();
    
    // Create some test recipes
    const recipes = await db.insert(recipesTable)
      .values([
        {
          title: 'Pancakes',
          description: 'Fluffy pancakes for breakfast',
          ingredients: ['flour', 'eggs', 'milk', 'butter'],
          instructions: 'Mix ingredients and cook on griddle',
          imageUrl: null,
        },
        {
          title: 'Caesar Salad',
          description: 'Classic Caesar salad for lunch',
          ingredients: ['romaine lettuce', 'croutons', 'parmesan', 'caesar dressing'],
          instructions: 'Mix all ingredients together',
          imageUrl: null,
        },
        {
          title: 'Chocolate Cake',
          description: 'Rich chocolate dessert',
          ingredients: ['flour', 'cocoa powder', 'eggs', 'sugar', 'butter'],
          instructions: 'Bake at 350°F for 30 minutes',
          imageUrl: null,
        },
      ])
      .returning();
    
    // Create recipe-category associations
    await db.insert(recipeCategoriesTable).values([
      { recipeId: recipes[0].id, categoryId: categories[0].id }, // Pancakes - Breakfast
      { recipeId: recipes[1].id, categoryId: categories[1].id }, // Caesar Salad - Lunch
      { recipeId: recipes[2].id, categoryId: categories[3].id }, // Chocolate Cake - Dessert
      { recipeId: recipes[1].id, categoryId: categories[2].id }, // Caesar Salad - Dinner (multi-category)
    ]);
  });

  afterEach(resetDB);

  it('should return all recipes when no query or categories provided', async () => {
    const result = await searchRecipes({});
    
    expect(result).toHaveLength(3);
    expect(result.map(r => r.title)).toEqual(
      expect.arrayContaining(['Pancakes', 'Caesar Salad', 'Chocolate Cake'])
    );
  });

  it('should search recipes by title', async () => {
    const input: SearchRecipesInput = { query: 'Pancakes' };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pancakes');
  });

  it('should search recipes by description', async () => {
    const input: SearchRecipesInput = { query: 'Caesar' };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Caesar Salad');
  });

  it('should search recipes by ingredients', async () => {
    const input: SearchRecipesInput = { query: 'eggs' };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(2);
    expect(result.map(r => r.title)).toEqual(
      expect.arrayContaining(['Pancakes', 'Chocolate Cake'])
    );
  });

  it('should filter recipes by single category', async () => {
    // Get the category ID for "Breakfast"
    const breakfastCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Breakfast'))
      .execute()
      .then(results => results[0]);
    
    const input: SearchRecipesInput = { categoryIds: [breakfastCategory.id] };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pancakes');
  });

  it('should filter recipes by multiple categories', async () => {
    // Get category IDs for "Lunch" and "Dinner"
    const lunchCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Lunch'))
      .execute()
      .then(results => results[0]);
    
    const dinnerCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Dinner'))
      .execute()
      .then(results => results[0]);
    
    const input: SearchRecipesInput = { categoryIds: [lunchCategory.id, dinnerCategory.id] };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Caesar Salad');
  });

  it('should search and filter recipes simultaneously', async () => {
    // Get the category ID for "Dessert"
    const dessertCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Dessert'))
      .execute()
      .then(results => results[0]);
    
    const input: SearchRecipesInput = { 
      query: 'chocolate', 
      categoryIds: [dessertCategory.id] 
    };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Chocolate Cake');
  });

  it('should return empty array when no recipes match', async () => {
    const input: SearchRecipesInput = { query: 'nonexistent' };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(0);
  });

  it('should handle case-insensitive search', async () => {
    const input: SearchRecipesInput = { query: 'PANCAKES' };
    const result = await searchRecipes(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pancakes');
  });
});
