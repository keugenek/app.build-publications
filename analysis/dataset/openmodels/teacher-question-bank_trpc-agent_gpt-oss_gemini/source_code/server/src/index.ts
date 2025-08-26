import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createQuestionInputSchema,
  updateQuestionInputSchema,
  deleteQuestionInputSchema,
  generateQuizInputSchema,
} from './schema';

// Import handler functions
import { createQuestion } from './handlers/create_question';
import { getQuestions } from './handlers/get_questions';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
import { generateQuiz } from './handlers/generate_quiz';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Simple healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Question CRUD
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),

  getQuestions: publicProcedure.query(() => getQuestions()),

  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),

  deleteQuestion: publicProcedure
    .input(deleteQuestionInputSchema)
    .mutation(({ input }) => deleteQuestion(input)),

  // Quiz generation
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .query(({ input }) => generateQuiz(input)),
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
