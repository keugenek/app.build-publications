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
  createMultipleChoiceOptionInputSchema,
  updateMultipleChoiceOptionInputSchema,
  createQuizInputSchema,
  generateQuizInputSchema,
  exportQuizToPdfInputSchema,
  questionFiltersSchema
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
import { getQuestionById } from './handlers/get_question_by_id';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
import { createMultipleChoiceOption } from './handlers/create_multiple_choice_option';
import { updateMultipleChoiceOption } from './handlers/update_multiple_choice_option';
import { deleteMultipleChoiceOption } from './handlers/delete_multiple_choice_option';
import { createQuiz } from './handlers/create_quiz';
import { generateQuiz } from './handlers/generate_quiz';
import { getQuizzes } from './handlers/get_quizzes';
import { getQuizById } from './handlers/get_quiz_by_id';
import { deleteQuiz } from './handlers/delete_quiz';
import { addQuestionToQuiz } from './handlers/add_question_to_quiz';
import { removeQuestionFromQuiz } from './handlers/remove_question_from_quiz';
import { exportQuizToPdf } from './handlers/export_quiz_to_pdf';

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
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSubject(input.id)),

  // Topic routes
  createTopic: publicProcedure
    .input(createTopicInputSchema)
    .mutation(({ input }) => createTopic(input)),
  
  getTopics: publicProcedure
    .input(z.object({ subjectId: z.number().optional() }).optional())
    .query(({ input }) => getTopics(input?.subjectId)),
  
  updateTopic: publicProcedure
    .input(updateTopicInputSchema)
    .mutation(({ input }) => updateTopic(input)),
  
  deleteTopic: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTopic(input.id)),

  // Question routes
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
  
  getQuestions: publicProcedure
    .input(questionFiltersSchema.optional())
    .query(({ input }) => getQuestions(input)),
  
  getQuestionById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getQuestionById(input.id)),
  
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),
  
  deleteQuestion: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteQuestion(input.id)),

  // Multiple choice option routes
  createMultipleChoiceOption: publicProcedure
    .input(createMultipleChoiceOptionInputSchema)
    .mutation(({ input }) => createMultipleChoiceOption(input)),
  
  updateMultipleChoiceOption: publicProcedure
    .input(updateMultipleChoiceOptionInputSchema)
    .mutation(({ input }) => updateMultipleChoiceOption(input)),
  
  deleteMultipleChoiceOption: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMultipleChoiceOption(input.id)),

  // Quiz routes
  createQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => createQuiz(input)),
  
  generateQuiz: publicProcedure
    .input(generateQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),
  
  getQuizzes: publicProcedure
    .query(() => getQuizzes()),
  
  getQuizById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getQuizById(input.id)),
  
  deleteQuiz: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteQuiz(input.id)),

  // Quiz-question management routes
  addQuestionToQuiz: publicProcedure
    .input(z.object({ 
      quizId: z.number(), 
      questionId: z.number(), 
      orderIndex: z.number().int() 
    }))
    .mutation(({ input }) => addQuestionToQuiz(input.quizId, input.questionId, input.orderIndex)),
  
  removeQuestionFromQuiz: publicProcedure
    .input(z.object({ 
      quizId: z.number(), 
      questionId: z.number() 
    }))
    .mutation(({ input }) => removeQuestionFromQuiz(input.quizId, input.questionId)),

  // PDF export route
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
  console.log(`Question Bank TRPC server listening at port: ${port}`);
}

start();
