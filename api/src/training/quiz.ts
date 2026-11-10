// Quiz shape and scoring, kept pure. A quiz is a short list of multiple-choice
// questions; each stores the index of the correct option. The correct answers are
// never sent to the browser (see publicQuiz) — scoring happens on the server.
import { AppError } from '../lib/http-error.js';

export type QuizQuestion = { question: string; options: string[]; answer: number };

// Validates unknown JSON (as loaded from the database or a request) into a quiz.
export function parseQuiz(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value))
    throw new AppError(400, 'bad_quiz', 'Quiz must be a list of questions');
  return value.map((raw, i) => {
    const q = raw as Partial<QuizQuestion>;
    if (
      typeof q.question !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      !q.options.every((o) => typeof o === 'string') ||
      typeof q.answer !== 'number' ||
      q.answer < 0 ||
      q.answer >= q.options.length
    ) {
      throw new AppError(400, 'bad_quiz', `Question ${i + 1} is malformed`);
    }
    return { question: q.question, options: q.options, answer: q.answer };
  });
}

// The version sent to the browser: questions and options, but not which is correct.
export function publicQuiz(quiz: QuizQuestion[]): { question: string; options: string[] }[] {
  return quiz.map((q) => ({ question: q.question, options: q.options }));
}

export function scoreQuiz(
  quiz: QuizQuestion[],
  answers: number[],
): { correct: number; total: number; passed: boolean } {
  let correct = 0;
  quiz.forEach((q, i) => {
    if (answers[i] === q.answer) correct += 1;
  });
  const total = quiz.length;
  // 60% to pass — lenient enough that a short quiz does not require a perfect score.
  const passed = total === 0 ? true : correct / total >= 0.6;
  return { correct, total, passed };
}
