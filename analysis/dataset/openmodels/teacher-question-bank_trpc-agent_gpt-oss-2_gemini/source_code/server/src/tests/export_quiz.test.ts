import { describe, expect, it } from 'bun:test';
import { exportQuiz } from '../handlers/export_quiz';
import type { ExportQuizInput, ExportQuizResult } from '../schema';

describe('exportQuiz handler', () => {
  it('should return a result with quizId and generated url', async () => {
    const input: ExportQuizInput = { quizId: 42 };
    const result = await exportQuiz(input);

    expect(result.quizId).toBe(42);
    expect(result.url).toBeDefined();
    expect(typeof result.url).toBe('string');
    expect(result.url).toBe(`https://example.com/quizzes/42.pdf`);
  });

  it('should still return result even if url is optional (placeholder behavior)', async () => {
    // Simulate placeholder by temporarily overriding implementation? Not needed since we always generate URL.
    const input: ExportQuizInput = { quizId: 7 };
    const result = await exportQuiz(input);
    expect(result.quizId).toBe(7);
    expect(result.url).toBe(`https://example.com/quizzes/7.pdf`);
  });
});
