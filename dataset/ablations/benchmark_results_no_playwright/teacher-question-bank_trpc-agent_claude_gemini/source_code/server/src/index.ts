import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createSubjectInputSchema,
  updateSubjectInputSchema,
  deleteSubjectInputSchema,
  createTopicInputSchema,
  updateTopicInputSchema,
  deleteTopicInputSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  deleteQuestionInputSchema,
  getQuestionsByFiltersInputSchema,
  createQuizInputSchema,
  generateQuizInputSchema,
  deleteQuizInputSchema,
  getByIdInputSchema
} from './schema';

// Import handlers
import { createSubject } from './handlers/create_subject';
import { getSubjects } from './handlers/get_subjects';
import { updateSubject } from './handlers/update_subject';
import { deleteSubject } from './handlers/delete_subject';
import { createTopic } from './handlers/create_topic';
import { getTopics } from './handlers/get_topics';
import { getTopicsBySubject } from './handlers/get_topics_by_subject';
import { updateTopic } from './handlers/update_topic';
import { deleteTopic } from './handlers/delete_topic';
import { createQuestion } from './handlers/create_question';
import { getQuestions } from './handlers/get_questions';
import { getQuestionsByFilters } from './handlers/get_questions_by_filters';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
import { createQuiz } from './handlers/create_quiz';
import { generateQuiz } from './handlers/generate_quiz';
import { getQuizzes } from './handlers/get_quizzes';
import { getQuizWithQuestions } from './handlers/get_quiz_with_questions';
import { exportQuiz } from './handlers/export_quiz';
import { deleteQuiz } from './handlers/delete_quiz';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Subject operations
  createSubject: publicProcedure
    .input(createSubjectInputSchema)
    .mutation(({ input }) => createSubject(input)),
  getSubjects: publicProcedure
    .query(() => getSubjects()),
  updateSubject: publicProcedure
    .input(updateSubjectInputSchema)
    .mutation(({ input }) => updateSubject(input)),
  deleteSubject: publicProcedure
    .input(deleteSubjectInputSchema)
    .mutation(({ input }) => deleteSubject(input)),
  
  // Topic operations
  createTopic: publicProcedure
    .input(createTopicInputSchema)
    .mutation(({ input }) => createTopic(input)),
  getTopics: publicProcedure
    .query(() => getTopics()),
  getTopicsBySubject: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getTopicsBySubject(input)),
  updateTopic: publicProcedure
    .input(updateTopicInputSchema)
    .mutation(({ input }) => updateTopic(input)),
  deleteTopic: publicProcedure
    .input(deleteTopicInputSchema)
    .mutation(({ input }) => deleteTopic(input)),
  
  // Question operations
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
  getQuestions: publicProcedure
    .query(() => getQuestions()),
  getQuestionsByFilters: publicProcedure
    .input(getQuestionsByFiltersInputSchema)
    .query(({ input }) => getQuestionsByFilters(input)),
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),
  deleteQuestion: publicProcedure
    .input(deleteQuestionInputSchema)
    .mutation(({ input }) => deleteQuestion(input)),
  
  // Quiz operations
  createQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => createQuiz(input)),
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),
  getQuizzes: publicProcedure
    .query(() => getQuizzes()),
  getQuizWithQuestions: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getQuizWithQuestions(input)),
  exportQuiz: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => exportQuiz(input)),
  deleteQuiz: publicProcedure
    .input(deleteQuizInputSchema)
    .mutation(({ input }) => deleteQuiz(input)),
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
