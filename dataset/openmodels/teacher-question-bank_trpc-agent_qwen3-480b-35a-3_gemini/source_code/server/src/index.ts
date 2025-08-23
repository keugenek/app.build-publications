import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createSubjectInputSchema,
  createTopicInputSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  generateQuizInputSchema
} from './schema';

// Import handlers
import { createSubject } from './handlers/create_subject';
import { getSubjects } from './handlers/get_subjects';
import { createTopic } from './handlers/create_topic';
import { getTopics, getTopicsBySubject } from './handlers/get_topics';
import { createQuestion } from './handlers/create_question';
import { getQuestions, getQuestionsBySubject, getQuestionsByTopic } from './handlers/get_questions';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
import { generateQuiz } from './handlers/generate_quiz';
import { getQuizzes } from './handlers/get_quizzes';
import { exportQuizToPDF } from './handlers/export_quiz';

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
    
  // Topic routes
  createTopic: publicProcedure
    .input(createTopicInputSchema)
    .mutation(({ input }) => createTopic(input)),
  getTopics: publicProcedure
    .query(() => getTopics()),
  getTopicsBySubject: publicProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(({ input }) => getTopicsBySubject(input.subjectId)),
    
  // Question routes
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
  getQuestions: publicProcedure
    .query(() => getQuestions()),
  getQuestionsBySubject: publicProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(({ input }) => getQuestionsBySubject(input.subjectId)),
  getQuestionsByTopic: publicProcedure
    .input(z.object({ topicId: z.number() }))
    .query(({ input }) => getQuestionsByTopic(input.topicId)),
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),
  deleteQuestion: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteQuestion(input.id)),
    
  // Quiz routes
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),
  getQuizzes: publicProcedure
    .query(() => getQuizzes()),
  exportQuiz: publicProcedure
    .input(z.object({ 
      quizId: z.number() 
    }))
    .mutation(async ({ input }) => {
      // In a real implementation, you would fetch the quiz and questions from the database
      // and then call exportQuizToPDF with the data
      return Promise.resolve({ success: true });
    }),
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
