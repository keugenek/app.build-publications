import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createBookInputSchema, 
  updateBookInputSchema,
  getBooksQuerySchema,
  deleteBookInputSchema
} from './schema';

// Import handlers
import { createBook } from './handlers/create_book';
import { getBooks } from './handlers/get_books';
import { getBookById } from './handlers/get_book_by_id';
import { updateBook } from './handlers/update_book';
import { deleteBook } from './handlers/delete_book';
import { getGenres } from './handlers/get_genres';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new book
  createBook: publicProcedure
    .input(createBookInputSchema)
    .mutation(({ input }) => createBook(input)),

  // Get all books with optional filtering and searching
  getBooks: publicProcedure
    .input(getBooksQuerySchema.optional())
    .query(({ input }) => getBooks(input)),

  // Get a single book by ID
  getBookById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBookById(input.id)),

  // Update an existing book
  updateBook: publicProcedure
    .input(updateBookInputSchema)
    .mutation(({ input }) => updateBook(input)),

  // Delete a book
  deleteBook: publicProcedure
    .input(deleteBookInputSchema)
    .mutation(({ input }) => deleteBook(input)),

  // Get all unique genres for filtering
  getGenres: publicProcedure
    .query(() => getGenres()),
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
  console.log(`Book Library TRPC server listening at port: ${port}`);
}

start();
