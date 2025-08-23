import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createSubjectInputSchema, 
  updateSubjectInputSchema,
  createTopicInputSchema,
  updateTopicInputSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  generateQuizInputSchema
} from './schema';

// Import handlers
import { createSubject } from './handlers/create_subject';
import { getSubjects } from './handlers/get_subjects';
import { updateSubject } from './handlers/update_subject';
import { deleteSubject } from './handlers/delete_subject';
import { createTopic } from './handlers/create_topic';
import { getTopics } from './handlers/get_topics';
import { updateTopic } from './handlers/update_topic';
import { deleteTopic } from './handlers/delete_topic';
import { createQuestion } from './handlers/create_question';
import { getQuestions } from './handlers/get_questions';
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
  
  // Subject routes
  createSubject: publicProcedure
    .input(createSubjectInputSchema)
    .mutation(({ input }) => createSubject(input)),
  getSubjects: publicProcedure
    .query(() => getSubjects()),
  updateSubject: publicProcedure
    .input(updateSubjectInputSchema)
    .mutation(({ input }) => updateSubject(input)),
  deleteSubject: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteSubject(input)),
  
  // Topic routes
  createTopic: publicProcedure
    .input(createTopicInputSchema)
    .mutation(({ input }) => createTopic(input)),
  getTopics: publicProcedure
    .query(() => getTopics()),
  updateTopic: publicProcedure
    .input(updateTopicInputSchema)
    .mutation(({ input }) => updateTopic(input)),
  deleteTopic: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteTopic(input)),
  
  // Question routes
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
  getQuestions: publicProcedure
    .query(() => getQuestions()),
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),
  deleteQuestion: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteQuestion(input)),
  
  // Quiz routes
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),
  exportQuiz: publicProcedure
    .input(z.number())
    .query(({ input }) => exportQuiz(input)),
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
