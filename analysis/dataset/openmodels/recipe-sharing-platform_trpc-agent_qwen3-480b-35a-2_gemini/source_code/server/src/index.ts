import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createRecipeInputSchema, 
  registerUserInputSchema, 
  loginUserInputSchema,
  searchRecipesInputSchema
} from './schema';

// Import handlers
import { createRecipe } from './handlers/create_recipe';
import { getRecipes } from './handlers/get_recipes';
import { getRecipeById } from './handlers/get_recipe_by_id';
import { getRecipeDetails } from './handlers/get_recipe_details';
import { updateRecipe } from './handlers/update_recipe';
import { deleteRecipe } from './handlers/delete_recipe';
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { getUserRecipes } from './handlers/get_user_recipes';
import { getFavoriteRecipes } from './handlers/get_favorite_recipes';
import { addFavoriteRecipe } from './handlers/add_favorite_recipe';
import { removeFavoriteRecipe } from './handlers/remove_favorite_recipe';
import { searchRecipes } from './handlers/search_recipes';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Recipe procedures
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input, 1)), // TODO: Replace with actual user ID from context
  getRecipes: publicProcedure
    .query(() => getRecipes()),
  getRecipe: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRecipeById(input.id)),
  getRecipeDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRecipeDetails(input.id)),
  updateRecipe: publicProcedure
    .input(z.object({ id: z.number() }).merge(createRecipeInputSchema.partial()))
    .mutation(({ input }) => updateRecipe(input)),
  deleteRecipe: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteRecipe(input.id)),
  
  // User procedures
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),
  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),
  getUserRecipes: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserRecipes(input.userId)),
  
  // Favorite recipes procedures
  getFavoriteRecipes: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getFavoriteRecipes(input.userId)),
  addFavoriteRecipe: publicProcedure
    .input(z.object({ userId: z.number(), recipeId: z.number() }))
    .mutation(({ input }) => addFavoriteRecipe(input.userId, input.recipeId)),
  removeFavoriteRecipe: publicProcedure
    .input(z.object({ userId: z.number(), recipeId: z.number() }))
    .mutation(({ input }) => removeFavoriteRecipe(input.userId, input.recipeId)),
  
  // Search procedures
  searchRecipes: publicProcedure
    .input(searchRecipesInputSchema)
    .query(({ input }) => searchRecipes(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
