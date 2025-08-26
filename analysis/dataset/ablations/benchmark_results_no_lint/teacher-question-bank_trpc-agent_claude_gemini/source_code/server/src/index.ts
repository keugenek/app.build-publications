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
  updateSubjectInputSchema,
  updateTopicInputSchema,
  updateQuestionInputSchema,
  generateQuizInputSchema,
  exportQuizToPdfInputSchema
} from './schema';

// Import handlers
import { createSubject } from './handlers/create_subject';
import { getSubjects } from './handlers/get_subjects';
import { updateSubject } from './handlers/update_subject';
import { createTopic } from './handlers/create_topic';
import { getTopics, getTopicsBySubject } from './handlers/get_topics';
import { updateTopic } from './handlers/update_topic';
import { createQuestion } from './handlers/create_question';
import { getQuestions, getQuestionsByTopic, getQuestionsBySubject } from './handlers/get_questions';
import { updateQuestion } from './handlers/update_question';
import { generateQuiz } from './handlers/generate_quiz';
import { getQuizzes, getQuizWithQuestions } from './handlers/get_quizzes';
import { exportQuizToPdf } from './handlers/export_quiz_to_pdf';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Subject management
  createSubject: publicProcedure
    .input(createSubjectInputSchema)
    .mutation(({ input }) => createSubject(input)),
  
  getSubjects: publicProcedure
    .query(() => getSubjects()),
  
  updateSubject: publicProcedure
    .input(updateSubjectInputSchema)
    .mutation(({ input }) => updateSubject(input)),

  // Topic management
  createTopic: publicProcedure
    .input(createTopicInputSchema)
    .mutation(({ input }) => createTopic(input)),
  
  getTopics: publicProcedure
    .query(() => getTopics()),
  
  getTopicsBySubject: publicProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(({ input }) => getTopicsBySubject(input.subjectId)),
  
  updateTopic: publicProcedure
    .input(updateTopicInputSchema)
    .mutation(({ input }) => updateTopic(input)),

  // Question management
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
  
  getQuestions: publicProcedure
    .query(() => getQuestions()),
  
  getQuestionsByTopic: publicProcedure
    .input(z.object({ topicId: z.number() }))
    .query(({ input }) => getQuestionsByTopic(input.topicId)),
  
  getQuestionsBySubject: publicProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(({ input }) => getQuestionsBySubject(input.subjectId)),
  
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),

  // Quiz management
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),
  
  getQuizzes: publicProcedure
    .query(() => getQuizzes()),
  
  getQuizWithQuestions: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(({ input }) => getQuizWithQuestions(input.quizId)),

  // PDF export
  exportQuizToPdf: publicProcedure
    .input(exportQuizToPdfInputSchema)
    .mutation(({ input }) => exportQuizToPdf(input)),
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
