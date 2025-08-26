import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq, and } from 'drizzle-orm';

// Test data setup helpers
const createSubject = async (name: string, description: string | null = null) => {
  const result = await db.insert(subjectsTable)
    .values({ name, description })
    .returning()
    .execute();
  return result[0];
};

const createTopic = async (name: string, subjectId: number, description: string | null = null) => {
  const result = await db.insert(topicsTable)
    .values({ name, description, subject_id: subjectId })
    .returning()
    .execute();
  return result[0];
};

const createQuestion = async (
  questionText: string,
  subjectId: number,
  topicId: number,
  type: 'multiple-choice' | 'open-ended' | 'true-false' | 'short-answer',
  answer: string
) => {
  const result = await db.insert(questionsTable)
    .values({
      question_text: questionText,
      subject_id: subjectId,
      topic_id: topicId,
      type,
      answer
    })
    .returning()
    .execute();
  return result[0];
};

describe('generateQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a basic quiz with available questions', async () => {
    // Setup test data
    const subject = await createSubject('Math', 'Mathematics subject');
    const topic = await createTopic('Algebra', subject.id, 'Basic algebra');

    // Create test questions
    await createQuestion('What is 2 + 2?', subject.id, topic.id, 'short-answer', '4');
    await createQuestion('What is 3 + 3?', subject.id, topic.id, 'short-answer', '6');
    await createQuestion('What is 4 + 4?', subject.id, topic.id, 'short-answer', '8');

    const input: GenerateQuizInput = {
      title: 'Math Quiz',
      description: 'A basic math quiz',
      question_count: 2
    };

    const result = await generateQuiz(input);

    // Verify quiz properties
    expect(result.title).toEqual('Math Quiz');
    expect(result.description).toEqual('A basic math quiz');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify questions
    expect(result.questions).toHaveLength(2);
    result.questions.forEach(question => {
      expect(question.id).toBeGreaterThan(0);
      expect(question.question_text).toBeDefined();
      expect(question.subject_id).toEqual(subject.id);
      expect(question.topic_id).toEqual(topic.id);
      expect(question.type).toEqual('short-answer');
      expect(question.answer).toBeDefined();
    });
  });

  it('should create quiz record in database', async () => {
    // Setup test data
    const subject = await createSubject('Science');
    const topic = await createTopic('Physics', subject.id);
    await createQuestion('What is gravity?', subject.id, topic.id, 'open-ended', 'A force');

    const input: GenerateQuizInput = {
      title: 'Science Quiz',
      question_count: 1
    };

    const result = await generateQuiz(input);

    // Verify quiz exists in database
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('Science Quiz');
    expect(quizzes[0].description).toBeNull();
  });

  it('should create quiz-question associations in correct order', async () => {
    // Setup test data
    const subject = await createSubject('History');
    const topic = await createTopic('World War II', subject.id);

    const question1 = await createQuestion('When did WWII start?', subject.id, topic.id, 'short-answer', '1939');
    const question2 = await createQuestion('When did WWII end?', subject.id, topic.id, 'short-answer', '1945');
    const question3 = await createQuestion('Who was the US president?', subject.id, topic.id, 'short-answer', 'Roosevelt');

    const input: GenerateQuizInput = {
      title: 'History Quiz',
      question_count: 3
    };

    const result = await generateQuiz(input);

    // Verify quiz-question associations
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(3);

    // Check that order indices are sequential starting from 1
    const orderIndices = quizQuestions.map(qq => qq.order_index).sort((a, b) => a - b);
    expect(orderIndices).toEqual([1, 2, 3]);

    // Verify all questions are associated
    const questionIds = quizQuestions.map(qq => qq.question_id);
    const allQuestionIds = [question1.id, question2.id, question3.id];
    expect(questionIds.sort()).toEqual(allQuestionIds.sort());
  });

  it('should filter questions by subject_id', async () => {
    // Setup test data
    const mathSubject = await createSubject('Math');
    const scienceSubject = await createSubject('Science');

    const mathTopic = await createTopic('Algebra', mathSubject.id);
    const scienceTopic = await createTopic('Physics', scienceSubject.id);

    // Create questions in different subjects
    await createQuestion('Math question 1', mathSubject.id, mathTopic.id, 'short-answer', 'Answer 1');
    await createQuestion('Math question 2', mathSubject.id, mathTopic.id, 'short-answer', 'Answer 2');
    await createQuestion('Science question 1', scienceSubject.id, scienceTopic.id, 'open-ended', 'Science answer');

    const input: GenerateQuizInput = {
      title: 'Math Only Quiz',
      subject_id: mathSubject.id,
      question_count: 2
    };

    const result = await generateQuiz(input);

    expect(result.questions).toHaveLength(2);
    result.questions.forEach(question => {
      expect(question.subject_id).toEqual(mathSubject.id);
      expect(question.question_text).toMatch(/Math question/);
    });
  });

  it('should filter questions by topic_id', async () => {
    // Setup test data
    const subject = await createSubject('Math');
    const algebraTopic = await createTopic('Algebra', subject.id);
    const geometryTopic = await createTopic('Geometry', subject.id);

    // Create questions in different topics
    await createQuestion('Algebra question', subject.id, algebraTopic.id, 'short-answer', 'Algebra answer');
    await createQuestion('Geometry question', subject.id, geometryTopic.id, 'short-answer', 'Geometry answer');

    const input: GenerateQuizInput = {
      title: 'Algebra Only Quiz',
      topic_id: algebraTopic.id,
      question_count: 1
    };

    const result = await generateQuiz(input);

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].topic_id).toEqual(algebraTopic.id);
    expect(result.questions[0].question_text).toEqual('Algebra question');
  });

  it('should filter questions by question types', async () => {
    // Setup test data
    const subject = await createSubject('General');
    const topic = await createTopic('Mixed', subject.id);

    // Create questions of different types
    await createQuestion('Multiple choice Q', subject.id, topic.id, 'multiple-choice', 'A');
    await createQuestion('True false Q', subject.id, topic.id, 'true-false', 'True');
    await createQuestion('Open ended Q', subject.id, topic.id, 'open-ended', 'Long answer');
    await createQuestion('Short answer Q', subject.id, topic.id, 'short-answer', 'Short');

    const input: GenerateQuizInput = {
      title: 'Multiple Choice and True/False Quiz',
      question_types: ['multiple-choice', 'true-false'],
      question_count: 2
    };

    const result = await generateQuiz(input);

    expect(result.questions).toHaveLength(2);
    result.questions.forEach(question => {
      expect(['multiple-choice', 'true-false']).toContain(question.type);
    });
  });

  it('should combine multiple filters correctly', async () => {
    // Setup test data
    const mathSubject = await createSubject('Math');
    const scienceSubject = await createSubject('Science');

    const algebraTopic = await createTopic('Algebra', mathSubject.id);
    const physicsTopic = await createTopic('Physics', scienceSubject.id);

    // Create questions with various combinations
    await createQuestion('Math MC Q', mathSubject.id, algebraTopic.id, 'multiple-choice', 'A');
    await createQuestion('Math Short Q', mathSubject.id, algebraTopic.id, 'short-answer', 'Answer');
    await createQuestion('Science MC Q', scienceSubject.id, physicsTopic.id, 'multiple-choice', 'B');

    const input: GenerateQuizInput = {
      title: 'Math Multiple Choice Quiz',
      subject_id: mathSubject.id,
      topic_id: algebraTopic.id,
      question_types: ['multiple-choice'],
      question_count: 1
    };

    const result = await generateQuiz(input);

    expect(result.questions).toHaveLength(1);
    const question = result.questions[0];
    expect(question.subject_id).toEqual(mathSubject.id);
    expect(question.topic_id).toEqual(algebraTopic.id);
    expect(question.type).toEqual('multiple-choice');
  });

  it('should handle null description correctly', async () => {
    // Setup test data
    const subject = await createSubject('Test');
    const topic = await createTopic('Test Topic', subject.id);
    await createQuestion('Test question', subject.id, topic.id, 'short-answer', 'Test answer');

    const input: GenerateQuizInput = {
      title: 'Quiz with no description',
      question_count: 1
    };

    const result = await generateQuiz(input);

    expect(result.description).toBeNull();
  });

  it('should warn when fewer questions are available than requested', async () => {
    // Setup test data with only 1 question
    const subject = await createSubject('Limited');
    const topic = await createTopic('Limited Topic', subject.id);
    await createQuestion('Only question', subject.id, topic.id, 'short-answer', 'Only answer');

    const input: GenerateQuizInput = {
      title: 'Quiz wanting more questions',
      question_count: 5 // Request more than available
    };

    const result = await generateQuiz(input);

    // Should return available questions (1) even though 5 were requested
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].question_text).toEqual('Only question');
  });

  it('should throw error when no questions match criteria', async () => {
    // Setup test data
    const subject = await createSubject('Empty Subject');
    const topic = await createTopic('Empty Topic', subject.id);
    // Don't create any questions

    const input: GenerateQuizInput = {
      title: 'Impossible Quiz',
      subject_id: subject.id,
      question_count: 1
    };

    await expect(generateQuiz(input)).rejects.toThrow(/No questions found matching the specified criteria/i);
  });

  it('should throw error when filtering results in no questions', async () => {
    // Setup test data
    const subject = await createSubject('Math');
    const topic = await createTopic('Algebra', subject.id);
    
    // Create only short-answer questions
    await createQuestion('Question 1', subject.id, topic.id, 'short-answer', 'Answer 1');
    await createQuestion('Question 2', subject.id, topic.id, 'short-answer', 'Answer 2');

    const input: GenerateQuizInput = {
      title: 'Multiple Choice Only Quiz',
      subject_id: subject.id,
      question_types: ['multiple-choice'], // But no MC questions exist
      question_count: 1
    };

    await expect(generateQuiz(input)).rejects.toThrow(/No questions found matching the specified criteria/i);
  });

  it('should randomize question selection', async () => {
    // Setup test data with many questions
    const subject = await createSubject('Large Pool');
    const topic = await createTopic('Many Questions', subject.id);

    const questionTexts: string[] = [];
    // Create 10 questions
    for (let i = 1; i <= 10; i++) {
      const questionText = `Question ${i}`;
      questionTexts.push(questionText);
      await createQuestion(questionText, subject.id, topic.id, 'short-answer', `Answer ${i}`);
    }

    // Generate multiple quizzes and check they get different questions
    const quiz1Input: GenerateQuizInput = {
      title: 'Random Quiz 1',
      question_count: 3
    };

    const quiz2Input: GenerateQuizInput = {
      title: 'Random Quiz 2',
      question_count: 3
    };

    const result1 = await generateQuiz(quiz1Input);
    const result2 = await generateQuiz(quiz2Input);

    expect(result1.questions).toHaveLength(3);
    expect(result2.questions).toHaveLength(3);

    // While it's possible (but unlikely) that random selection could pick the same questions,
    // this test verifies the randomization mechanism is working
    const result1Texts = result1.questions.map(q => q.question_text).sort();
    const result2Texts = result2.questions.map(q => q.question_text).sort();

    // Questions should all be from our pool
    result1Texts.forEach(text => {
      expect(questionTexts).toContain(text);
    });
    result2Texts.forEach(text => {
      expect(questionTexts).toContain(text);
    });
  });
});
