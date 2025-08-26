import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { Recipe, CreateRecipeInput, SearchRecipesInput } from '../../server/src/schema';

function App() {
  // State for recipes list
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form state for creating a recipe
  const [formData, setFormData] = useState<CreateRecipeInput>({
    title: '',
    description: null,
    ingredients: [],
    instructions: '',
    categories: [],
    image_url: null,
  });
  // Helper strings for comma‑separated inputs
  const [ingredientsStr, setIngredientsStr] = useState<string>('');
  const [categoriesStr, setCategoriesStr] = useState<string>('');

  // Load all recipes on mount
  const loadRecipes = useCallback(async () => {
    try {
      const data = await trpc.getRecipes.query();
      setRecipes(data as Recipe[]);
    } catch (err) {
      console.error('Failed to load recipes', err);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const input: SearchRecipesInput = { query: searchTerm };
      const result = await trpc.searchRecipes.query(input);
      setRecipes(result as Recipe[]);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit new recipe
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert comma‑separated strings to arrays
      const payload: CreateRecipeInput = {
        ...formData,
        ingredients: ingredientsStr
          .split(/\s*,\s*/)
          .filter((i) => i.length > 0),
        categories: categoriesStr
          .split(/\s*,\s*/)
          .filter((c) => c.length > 0),
      };
      const created = await trpc.createRecipe.mutate(payload);
      // Append to list
      setRecipes((prev) => [...prev, created as Recipe]);
      // Reset form
      setFormData({
        title: '',
        description: null,
        ingredients: [],
        instructions: '',
        categories: [],
        image_url: null,
      });
      setIngredientsStr('');
      setCategoriesStr('');
    } catch (err) {
      console.error('Create recipe error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Recipe Community</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* New Recipe Form */}
      <section className="border rounded-lg p-4 mb-8 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4">Post a New Recipe</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input
            placeholder="Description (optional)"
            value={formData.description ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value || null }))}
          />
          <Input
            placeholder="Ingredients (comma separated)"
            value={ingredientsStr}
            onChange={(e) => setIngredientsStr(e.target.value)}
            required
          />
          <Input
            placeholder="Instructions"
            value={formData.instructions}
            onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
            required
          />
          <Input
            placeholder="Categories (comma separated)"
            value={categoriesStr}
            onChange={(e) => setCategoriesStr(e.target.value)}
            required
          />
          <Input
            placeholder="Image URL (optional)"
            value={formData.image_url ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value || null }))}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Recipe'}
          </Button>
        </form>
      </section>

      {/* Recipe List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-gray-500">No recipes found.</p>
        ) : (
          <div className="grid gap-4">
            {recipes.map((r) => (
              <article key={r.id} className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                {r.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{r.description}</p>
                )}
                {r.image_url && (
                  <img src={r.image_url} alt={r.title} className="w-full h-48 object-cover rounded mb-2" />
                )}
                <p className="font-medium mb-1">Ingredients:</p>
                <ul className="list-disc list-inside mb-2">
                  {r.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
                <p className="font-medium mb-1">Instructions:</p>
                <p className="whitespace-pre-wrap mb-2">{r.instructions}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Categories: {r.categories.join(', ')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-600 mt-2">
                  Posted on {new Date(r.created_at).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
