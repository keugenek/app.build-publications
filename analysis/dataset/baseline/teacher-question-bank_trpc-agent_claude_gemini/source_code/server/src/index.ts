import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createSubjectInputSchema,
  updateSubjectInputSchema,
  deleteInputSchema,
  createTopicInputSchema,
  updateTopicInputSchema,
  getTopicsBySubjectInputSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  getByIdInputSchema,
  getQuestionsInputSchema,
  generateQuizInputSchema,
  exportQuizInputSchema
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
import { getQuestionById } from './handlers/get_question_by_id';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
import { generateQuiz } from './handlers/generate_quiz';
import { getQuizById } from './handlers/get_quiz_by_id';
import { getQuizzes } from './handlers/get_quizzes';
import { deleteQuiz } from './handlers/delete_quiz';
import { exportQuiz } from './handlers/export_quiz';

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

  // Subject management routes
  createSubject: publicProcedure
    .input(createSubjectInputSchema)
    .mutation(({ input }) => createSubject(input)),

  getSubjects: publicProcedure
    .query(() => getSubjects()),

  updateSubject: publicProcedure
    .input(updateSubjectInputSchema)
    .mutation(({ input }) => updateSubject(input)),

  deleteSubject: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteSubject(input)),

  // Topic management routes
  createTopic: publicProcedure
    .input(createTopicInputSchema)
    .mutation(({ input }) => createTopic(input)),

  getTopics: publicProcedure
    .query(() => getTopics()),

  getTopicsBySubject: publicProcedure
    .input(getTopicsBySubjectInputSchema)
    .query(({ input }) => getTopicsBySubject(input)),

  updateTopic: publicProcedure
    .input(updateTopicInputSchema)
    .mutation(({ input }) => updateTopic(input)),

  deleteTopic: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTopic(input)),

  // Question management routes
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),

  getQuestions: publicProcedure
    .input(getQuestionsInputSchema.optional())
    .query(({ input }) => getQuestions(input)),

  getQuestionById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getQuestionById(input)),

  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),

  deleteQuestion: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteQuestion(input)),

  // Quiz management routes
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),

  getQuizzes: publicProcedure
    .query(() => getQuizzes()),

  getQuizById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getQuizById(input)),

  deleteQuiz: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteQuiz(input)),

  // Quiz export route
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
  console.log(`Question Bank TRPC server listening at port: ${port}`);
}

start();
