import { describe, expect, it } from 'vitest';
import { parseQuiz, publicQuiz, scoreQuiz, type QuizQuestion } from './quiz.js';

const quiz: QuizQuestion[] = [
  { question: 'q1', options: ['a', 'b'], answer: 1 },
  { question: 'q2', options: ['a', 'b', 'c'], answer: 0 },
  { question: 'q3', options: ['a', 'b'], answer: 0 },
];

describe('scoreQuiz', () => {
  it('counts correct answers and passes at 70%', () => {
    expect(scoreQuiz(quiz, [1, 0, 0])).toEqual({ correct: 3, total: 3, passed: true });
    expect(scoreQuiz(quiz, [1, 0, 1])).toMatchObject({ correct: 2, passed: true });
    expect(scoreQuiz(quiz, [0, 1, 1])).toMatchObject({ correct: 0, passed: false });
  });
});

describe('publicQuiz', () => {
  it('strips the correct-answer index', () => {
    const pub = publicQuiz(quiz);
    expect(pub[0]).toEqual({ question: 'q1', options: ['a', 'b'] });
    expect(JSON.stringify(pub)).not.toContain('answer');
  });
});

describe('parseQuiz', () => {
  it('rejects malformed questions', () => {
    expect(() => parseQuiz([{ question: 'q', options: ['only one'], answer: 0 }])).toThrow();
    expect(() => parseQuiz([{ question: 'q', options: ['a', 'b'], answer: 5 }])).toThrow();
    expect(() => parseQuiz('not a list')).toThrow();
  });

  it('accepts a well-formed quiz', () => {
    expect(parseQuiz(quiz)).toHaveLength(3);
  });
});
