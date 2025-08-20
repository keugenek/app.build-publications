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
  getQuestionsBySubjectTopicInputSchema,
  generateQuizInputSchema
} from './schema';

// Import handlers
import { createQuestion } from './handlers/create_question';
import { getQuestions } from './handlers/get_questions';
import { getQuestionsBySubjectTopic } from './handlers/get_questions_by_subject_topic';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
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
  
  // Question management procedures
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
    
  getQuestions: publicProcedure
    .query(() => getQuestions()),
    
  getQuestionsBySubjectTopic: publicProcedure
    .input(getQuestionsBySubjectTopicInputSchema)
    .query(({ input }) => getQuestionsBySubjectTopic(input)),
    
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),
    
  deleteQuestion: publicProcedure
    .input(deleteQuestionInputSchema)
    .mutation(({ input }) => deleteQuestion(input)),
    
  // Quiz generation procedures
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .query(({ input }) => generateQuiz(input)),
    
  exportQuiz: publicProcedure
    .input(generateQuizInputSchema)
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
