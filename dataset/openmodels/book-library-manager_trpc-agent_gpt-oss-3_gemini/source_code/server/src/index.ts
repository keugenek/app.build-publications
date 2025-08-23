import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { createBookInputSchema, updateBookInputSchema, searchBooksInputSchema } from './schema';
import { createBook } from './handlers/create_book';
import { getBooks } from './handlers/get_books';
import { getBookById } from './handlers/get_book_by_id';
import { updateBook } from './handlers/update_book';
import { deleteBook } from './handlers/delete_book';
import { searchBooks } from './handlers/search_books';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // CRUD routes for books
  createBook: publicProcedure
    .input(createBookInputSchema)
    .mutation(({ input }) => createBook(input)),
  getBooks: publicProcedure.query(() => getBooks()),
  getBookById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBookById(input.id)),
  updateBook: publicProcedure
    .input(updateBookInputSchema)
    .mutation(({ input }) => updateBook(input)),
  deleteBook: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBook(input.id)),
  searchBooks: publicProcedure
    .input(searchBooksInputSchema)
    .query(({ input }) => searchBooks(input)),
  

  
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
