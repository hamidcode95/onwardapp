import { describe, it, expect } from 'vitest';
import {
  ADHDAnswer,
  calculateDimensionScore,
  calculateProfileScores,
  rawAverageToScore,
  describeChallengeLevel,
  getTopChallengeAreas,
  getRecommendedFeatures,
  PROFILE_DIMENSIONS,
} from './adhdProfile';

describe('rawAverageToScore', () => {
  it('maps a raw average of 0 to a score of 1', () => {
    expect(rawAverageToScore(0)).toBe(1);
  });

  it('maps a raw average of 4 (max) to a score of 10', () => {
    expect(rawAverageToScore(4)).toBe(10);
  });

  it('maps a raw average of 2 to 6 (5.5 rounds up)', () => {
    expect(rawAverageToScore(2)).toBe(6);
  });

  it('clamps to the 1-10 range even with an out-of-spec input', () => {
    expect(rawAverageToScore(-1)).toBe(1);
    expect(rawAverageToScore(100)).toBe(10);
  });
});

describe('calculateDimensionScore', () => {
  it('averages multiple raw answers for a dimension', () => {
    // (0 + 4) / 2 = 2 -> rawAverageToScore(2) = 6
    expect(calculateDimensionScore([0, 4])).toBe(6);
  });

  it('handles a single-question dimension', () => {
    expect(calculateDimensionScore([3])).toBe(rawAverageToScore(3));
  });
});

describe('calculateProfileScores', () => {
  it('gives every dimension a score of 1 when every answer is Never (0)', () => {
    const answers: ADHDAnswer[] = Array(10).fill(0) as ADHDAnswer[];
    const scores = calculateProfileScores(answers);
    for (const dimension of PROFILE_DIMENSIONS) {
      expect(scores[dimension]).toBe(1);
    }
  });

  it('gives every dimension a score of 10 when every answer is Almost always (4)', () => {
    const answers: ADHDAnswer[] = Array(10).fill(4) as ADHDAnswer[];
    const scores = calculateProfileScores(answers);
    for (const dimension of PROFILE_DIMENSIONS) {
      expect(scores[dimension]).toBe(10);
    }
  });

  it('produces a sensible mixed profile matching the question -> dimension map', () => {
    // q1,q2 -> attention; q3,q4 -> executive_function; q5,q6 -> task_management;
    // q7 -> hyperactivity; q8,q9 -> impulsivity; q10 -> emotional_regulation
    const answers: ADHDAnswer[] = [4, 4, 0, 0, 2, 2, 4, 0, 0, 4];
    const scores = calculateProfileScores(answers);

    expect(scores.attention).toBe(10); // avg 4 -> 10
    expect(scores.executive_function).toBe(1); // avg 0 -> 1
    expect(scores.task_management).toBe(6); // avg 2 -> 6
    expect(scores.hyperactivity).toBe(10); // single answer 4 -> 10
    expect(scores.impulsivity).toBe(1); // avg 0 -> 1
    expect(scores.emotional_regulation).toBe(10); // single answer 4 -> 10
  });

  it('is stable when given a partial/missing answer array (defensive, should not throw)', () => {
    const answers = [2, 2] as ADHDAnswer[]; // only 2 of 10 answered
    expect(() => calculateProfileScores(answers)).not.toThrow();
  });
});

describe('describeChallengeLevel', () => {
  it('labels low scores as less challenging', () => {
    expect(describeChallengeLevel(1)).toBe('less');
    expect(describeChallengeLevel(3)).toBe('less');
  });

  it('labels mid scores as moderate', () => {
    expect(describeChallengeLevel(4)).toBe('moderate');
    expect(describeChallengeLevel(6)).toBe('moderate');
  });

  it('labels high scores (>= 7) as more challenging', () => {
    expect(describeChallengeLevel(7)).toBe('more');
    expect(describeChallengeLevel(10)).toBe('more');
  });
});

describe('getTopChallengeAreas', () => {
  it('returns dimensions sorted by score, highest first', () => {
    const scores = {
      attention: 3,
      executive_function: 9,
      task_management: 5,
      hyperactivity: 1,
      impulsivity: 8,
      emotional_regulation: 2,
    };
    const top = getTopChallengeAreas(scores, 3);
    expect(top).toEqual(['executive_function', 'impulsivity', 'task_management']);
  });
});

describe('getRecommendedFeatures', () => {
  it('recommends features tied to the highest-scoring dimensions', () => {
    const scores = {
      attention: 9,
      executive_function: 2,
      task_management: 2,
      hyperactivity: 2,
      impulsivity: 2,
      emotional_regulation: 2,
    };
    const features = getRecommendedFeatures(scores, 2);
    // attention -> ['focus', 'dump']
    expect(features).toEqual(['focus', 'dump']);
  });

  it('never returns duplicate features even if multiple high dimensions map to the same one', () => {
    const scores = {
      attention: 9,
      executive_function: 2,
      task_management: 9, // also maps to 'focus'
      hyperactivity: 2,
      impulsivity: 2,
      emotional_regulation: 2,
    };
    const features = getRecommendedFeatures(scores, 5);
    const unique = new Set(features);
    expect(unique.size).toBe(features.length);
  });
});
