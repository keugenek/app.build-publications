import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  bookSchema, 
  createBookInputSchema, 
  updateBookInputSchema,
  deleteBookInputSchema
} from './schema';
import { createBook } from './handlers/create_book';
import { getBooks } from './handlers/get_books';
import { updateBook } from './handlers/update_book';
import { deleteBook } from './handlers/delete_book';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'book-library-management'
    };
  }),
  createBook: publicProcedure
    .input(createBookInputSchema)
    .mutation(({ input }) => createBook(input)),
  getBooks: publicProcedure
    .query(() => getBooks()),
  updateBook: publicProcedure
    .input(updateBookInputSchema)
    .mutation(({ input }) => updateBook(input)),
  deleteBook: publicProcedure
    .input(deleteBookInputSchema)
    .mutation(({ input }) => deleteBook(input)),
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
