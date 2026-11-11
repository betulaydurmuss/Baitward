import { describe, expect, it } from 'vitest';
import { averageScore, riskBand, scoreFromEventTypes } from './score.js';

describe('scoreFromEventTypes', () => {
  it('adds weights once per distinct behaviour', () => {
    expect(scoreFromEventTypes(['opened', 'clicked'])).toBe(20);
    expect(scoreFromEventTypes(['opened', 'opened', 'clicked'])).toBe(20); // dedupe
    expect(scoreFromEventTypes(['submitted'])).toBe(40);
  });

  it('rewards reporting and training, never going below zero', () => {
    expect(scoreFromEventTypes(['opened', 'reported'])).toBe(0); // 5 - 20 clamped
    expect(scoreFromEventTypes(['clicked', 'trained'])).toBe(5); // 15 - 10
  });

  it('clamps to 100', () => {
    expect(scoreFromEventTypes(['opened', 'clicked', 'submitted'])).toBe(60);
  });
});

describe('riskBand', () => {
  it('bands scores into low / medium / high', () => {
    expect(riskBand(5)).toBe('low');
    expect(riskBand(20)).toBe('medium');
    expect(riskBand(40)).toBe('high');
  });
});

describe('averageScore', () => {
  it('rounds the mean and handles empty input', () => {
    expect(averageScore([10, 20, 30])).toBe(20);
    expect(averageScore([])).toBe(0);
  });
});
