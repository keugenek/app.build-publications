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
  createKanjiInputSchema,
  kanjisByLevelInputSchema,
  recordAnswerInputSchema,
} from './schema';

// Import handler functions
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createKanji } from './handlers/create_kanji';
import { getKanjisByLevel } from './handlers/get_kanjis_by_level';
import { recordAnswer } from './handlers/record_answer';
import { getProgress } from './handlers/get_progress';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // User routes
  registerUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => registerUser(input)),
  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),
  // Kanji routes
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
  getKanjisByLevel: publicProcedure
    .input(kanjisByLevelInputSchema)
    .query(({ input }) => getKanjisByLevel(input)),
  // Review routes
  recordAnswer: publicProcedure
    .input(recordAnswerInputSchema)
    .mutation(({ input }) => recordAnswer(input)),
  getProgress: publicProcedure
    .input(z.object({ user_id: z.number().int() }))
    .query(({ input }) => getProgress(input.user_id)),
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
