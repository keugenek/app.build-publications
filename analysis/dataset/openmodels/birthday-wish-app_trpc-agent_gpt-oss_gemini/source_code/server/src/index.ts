import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createCardInputSchema, updateCardInputSchema } from './schema';
import { createCard } from './handlers/create_card';
import { getCards } from './handlers/get_cards';
import { updateCard } from './handlers/update_card';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createCard: publicProcedure
    .input(createCardInputSchema)
    .mutation(({ input }) => createCard(input)),
  getCards: publicProcedure.query(() => getCards()),
  updateCard: publicProcedure
    .input(updateCardInputSchema)
    .mutation(({ input }) => updateCard(input)),
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
