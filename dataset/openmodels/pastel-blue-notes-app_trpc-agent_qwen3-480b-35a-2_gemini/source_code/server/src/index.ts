import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { login } from './handlers/login';
import { createCategory } from './handlers/create_category';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { getCategories } from './handlers/get_categories';
import { createNote } from './handlers/create_note';
import { updateNote } from './handlers/update_note';
import { deleteNote } from './handlers/delete_note';
import { getNotes } from './handlers/get_notes';

// Context type
interface Context {
  userId?: number;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  // Categories
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input, ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return createCategory(input, ctx.userId);
    }),
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input, ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return updateCategory(input, ctx.userId);
    }),
  deleteCategory: publicProcedure
    .input(z.number())
    .mutation(({ input: id, ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return deleteCategory(id, ctx.userId);
    }),
  getCategories: publicProcedure
    .query(({ ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return getCategories(ctx.userId);
    }),
  // Notes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input, ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return createNote(input, ctx.userId);
    }),
  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input, ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return updateNote(input, ctx.userId);
    }),
  deleteNote: publicProcedure
    .input(z.number())
    .mutation(({ input: id, ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return deleteNote(id, ctx.userId);
    }),
  getNotes: publicProcedure
    .query(({ ctx }) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return getNotes(ctx.userId);
    }),
});

export type AppRouter = typeof appRouter;

// Context type
interface Context {
  userId?: number;
}

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext(): Context {
      // TODO: Implement proper authentication middleware
      // This is where we would verify JWT tokens and extract user ID
      return {
        userId: 1, // Placeholder user ID
      };
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
