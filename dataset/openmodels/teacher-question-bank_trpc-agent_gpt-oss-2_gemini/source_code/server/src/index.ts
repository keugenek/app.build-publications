import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schemas for input validation
import {
  createQuestionInputSchema,
  updateQuestionInputSchema,
  generateQuizInputSchema,
  exportQuizInputSchema,
} from './schema';

// Handlers
import { createQuestion } from './handlers/create_question';
import { getQuestions } from './handlers/get_questions';
import { updateQuestion } from './handlers/update_question';
import { generateQuiz } from './handlers/generate_quiz';
import { exportQuiz } from './handlers/export_quiz';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
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
  // Quiz generation
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),
  // Export quiz (placeholder)
  exportQuiz: publicProcedure
    .input(exportQuizInputSchema)
    .mutation(({ input }) => exportQuiz(input)),
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
