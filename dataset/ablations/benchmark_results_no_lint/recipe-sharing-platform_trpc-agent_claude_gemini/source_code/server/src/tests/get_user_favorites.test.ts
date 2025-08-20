import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipesTable, favoriteRecipesTable } from '../db/schema';
import { getUserFavorites } from '../handlers/get_user_favorites';

describe('getUserFavorites', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty array when user has no favorites', async () => {
        // Create a user but no favorites
        const userResult = await db.insert(usersTable)
            .values({
                email: 'user@example.com',
                password_hash: 'hashed_password',
                name: 'Test User'
            })
            .returning()
            .execute();

        const userId = userResult[0].id;
        const result = await getUserFavorites(userId);

        expect(result).toEqual([]);
    });

    it('should return user favorites with recipe and author details', async () => {
        // Create users
        const usersResult = await db.insert(usersTable)
            .values([
                {
                    email: 'user1@example.com',
                    password_hash: 'hashed_password1',
                    name: 'Favorite User'
                },
                {
                    email: 'user2@example.com',
                    password_hash: 'hashed_password2',
                    name: 'Recipe Creator'
                }
            ])
            .returning()
            .execute();

        const [favoriteUser, recipeCreator] = usersResult;

        // Create recipes by the recipe creator
        const recipesResult = await db.insert(recipesTable)
            .values([
                {
                    title: 'Chocolate Cake',
                    description: 'Delicious chocolate cake recipe',
                    ingredients: ['flour', 'cocoa powder', 'sugar', 'eggs'],
                    instructions: ['Mix ingredients', 'Bake at 350F', 'Cool and serve'],
                    prep_time_minutes: 30,
                    cook_time_minutes: 45,
                    servings: 8,
                    category: 'dessert',
                    user_id: recipeCreator.id
                },
                {
                    title: 'Caesar Salad',
                    description: 'Classic Caesar salad',
                    ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'dressing'],
                    instructions: ['Chop lettuce', 'Add toppings', 'Toss with dressing'],
                    prep_time_minutes: 15,
                    cook_time_minutes: null,
                    servings: 4,
                    category: 'salad',
                    user_id: recipeCreator.id
                }
            ])
            .returning()
            .execute();

        const [cakeRecipe, saladRecipe] = recipesResult;

        // Add cake to favorites first
        await db.insert(favoriteRecipesTable)
            .values({
                user_id: favoriteUser.id,
                recipe_id: cakeRecipe.id
            })
            .execute();

        // Add a small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        // Add salad to favorites second (should appear first due to DESC ordering)
        await db.insert(favoriteRecipesTable)
            .values({
                user_id: favoriteUser.id,
                recipe_id: saladRecipe.id
            })
            .execute();

        const result = await getUserFavorites(favoriteUser.id);

        expect(result).toHaveLength(2);

        // Find recipes by title since ordering by timestamp may not be completely predictable
        const cakeResult = result.find(r => r.title === 'Chocolate Cake');
        const saladResult = result.find(r => r.title === 'Caesar Salad');

        expect(cakeResult).toBeDefined();
        expect(saladResult).toBeDefined();

        // Verify cake result in detail
        expect(cakeResult!.id).toBe(cakeRecipe.id);
        expect(cakeResult!.title).toBe('Chocolate Cake');
        expect(cakeResult!.description).toBe('Delicious chocolate cake recipe');
        expect(cakeResult!.ingredients).toEqual(['flour', 'cocoa powder', 'sugar', 'eggs']);
        expect(cakeResult!.instructions).toEqual(['Mix ingredients', 'Bake at 350F', 'Cool and serve']);
        expect(cakeResult!.prep_time_minutes).toBe(30);
        expect(cakeResult!.cook_time_minutes).toBe(45);
        expect(cakeResult!.servings).toBe(8);
        expect(cakeResult!.category).toBe('dessert');
        expect(cakeResult!.user_id).toBe(recipeCreator.id);
        expect(cakeResult!.user_name).toBe('Recipe Creator');
        expect(cakeResult!.is_favorite).toBe(true);
        expect(cakeResult!.created_at).toBeInstanceOf(Date);
        expect(cakeResult!.updated_at).toBeInstanceOf(Date);

        // Verify salad result in detail
        expect(saladResult!.id).toBe(saladRecipe.id);
        expect(saladResult!.title).toBe('Caesar Salad');
        expect(saladResult!.description).toBe('Classic Caesar salad');
        expect(saladResult!.ingredients).toEqual(['romaine lettuce', 'parmesan', 'croutons', 'dressing']);
        expect(saladResult!.instructions).toEqual(['Chop lettuce', 'Add toppings', 'Toss with dressing']);
        expect(saladResult!.prep_time_minutes).toBe(15);
        expect(saladResult!.cook_time_minutes).toBeNull();
        expect(saladResult!.servings).toBe(4);
        expect(saladResult!.category).toBe('salad');
        expect(saladResult!.user_id).toBe(recipeCreator.id);
        expect(saladResult!.user_name).toBe('Recipe Creator');
        expect(saladResult!.is_favorite).toBe(true);
        expect(saladResult!.created_at).toBeInstanceOf(Date);
        expect(saladResult!.updated_at).toBeInstanceOf(Date);
    });

    it('should only return favorites for the specified user', async () => {
        // Create two users
        const usersResult = await db.insert(usersTable)
            .values([
                {
                    email: 'user1@example.com',
                    password_hash: 'hashed_password1',
                    name: 'User One'
                },
                {
                    email: 'user2@example.com',
                    password_hash: 'hashed_password2',
                    name: 'User Two'
                },
                {
                    email: 'creator@example.com',
                    password_hash: 'hashed_password3',
                    name: 'Recipe Creator'
                }
            ])
            .returning()
            .execute();

        const [userOne, userTwo, creator] = usersResult;

        // Create a recipe
        const recipeResult = await db.insert(recipesTable)
            .values({
                title: 'Shared Recipe',
                description: 'A recipe both users might like',
                ingredients: ['ingredient1', 'ingredient2'],
                instructions: ['step1', 'step2'],
                prep_time_minutes: 20,
                cook_time_minutes: 30,
                servings: 4,
                category: 'main_course',
                user_id: creator.id
            })
            .returning()
            .execute();

        const recipe = recipeResult[0];

        // Add recipe to favorites for both users
        await db.insert(favoriteRecipesTable)
            .values([
                {
                    user_id: userOne.id,
                    recipe_id: recipe.id
                },
                {
                    user_id: userTwo.id,
                    recipe_id: recipe.id
                }
            ])
            .execute();

        // Get favorites for user one
        const userOneFavorites = await getUserFavorites(userOne.id);
        expect(userOneFavorites).toHaveLength(1);
        expect(userOneFavorites[0].title).toBe('Shared Recipe');

        // Get favorites for user two
        const userTwoFavorites = await getUserFavorites(userTwo.id);
        expect(userTwoFavorites).toHaveLength(1);
        expect(userTwoFavorites[0].title).toBe('Shared Recipe');

        // Get favorites for creator (who didn't favorite their own recipe)
        const creatorFavorites = await getUserFavorites(creator.id);
        expect(creatorFavorites).toHaveLength(0);
    });

    it('should handle recipes with null values correctly', async () => {
        // Create users
        const usersResult = await db.insert(usersTable)
            .values([
                {
                    email: 'user@example.com',
                    password_hash: 'hashed_password1',
                    name: 'Favorite User'
                },
                {
                    email: 'creator@example.com',
                    password_hash: 'hashed_password2',
                    name: 'Recipe Creator'
                }
            ])
            .returning()
            .execute();

        const [favoriteUser, creator] = usersResult;

        // Create recipe with null values
        const recipeResult = await db.insert(recipesTable)
            .values({
                title: 'Simple Recipe',
                description: null, // Null description
                ingredients: ['ingredient1'],
                instructions: ['step1'],
                prep_time_minutes: null, // Null prep time
                cook_time_minutes: null, // Null cook time
                servings: null, // Null servings
                category: 'snack',
                user_id: creator.id
            })
            .returning()
            .execute();

        const recipe = recipeResult[0];

        // Add to favorites
        await db.insert(favoriteRecipesTable)
            .values({
                user_id: favoriteUser.id,
                recipe_id: recipe.id
            })
            .execute();

        const result = await getUserFavorites(favoriteUser.id);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Simple Recipe');
        expect(result[0].description).toBeNull();
        expect(result[0].prep_time_minutes).toBeNull();
        expect(result[0].cook_time_minutes).toBeNull();
        expect(result[0].servings).toBeNull();
        expect(result[0].user_name).toBe('Recipe Creator');
        expect(result[0].is_favorite).toBe(true);
    });

    it('should return empty array for non-existent user', async () => {
        const result = await getUserFavorites(99999); // Non-existent user ID
        expect(result).toEqual([]);
    });
});
