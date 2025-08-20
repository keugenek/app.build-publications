import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  loginUserInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  deleteCategoryInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema,
  deleteNoteInputSchema,
  getNotesByUserInputSchema,
  getNotesByCategoryInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createCategory } from './handlers/create_category';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { getCategories } from './handlers/get_categories';
import { createNote } from './handlers/create_note';
import { updateNote } from './handlers/update_note';
import { deleteNote } from './handlers/delete_note';
import { getNotesByUser } from './handlers/get_notes_by_user';
import { getNotesByCategory } from './handlers/get_notes_by_category';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),

  deleteCategory: publicProcedure
    .input(deleteCategoryInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  getCategories: publicProcedure
    .input(getNotesByUserInputSchema)
    .query(({ input }) => getCategories(input)),

  // Note management routes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),

  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),

  deleteNote: publicProcedure
    .input(deleteNoteInputSchema)
    .mutation(({ input }) => deleteNote(input)),

  getNotesByUser: publicProcedure
    .input(getNotesByUserInputSchema)
    .query(({ input }) => getNotesByUser(input)),

  getNotesByCategory: publicProcedure
    .input(getNotesByCategoryInputSchema)
    .query(({ input }) => getNotesByCategory(input)),
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
  console.log(`TRPC Notes API server listening at port: ${port}`);
}

start();
