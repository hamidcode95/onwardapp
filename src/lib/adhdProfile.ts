/**
 * "Your ADHD Profile" — the onboarding Journey's questionnaire, scoring,
 * and personalization mapping.
 *
 * IMPORTANT FRAMING: this is a personalization profile, not a diagnostic
 * instrument. Scores describe self-reported difficulty ("challenge level")
 * in each area. The questions draw on well-established adult ADHD symptom
 * domains, but this specific 10-question scoring system is NOT a
 * clinically validated screening tool and must never be presented as one.
 */

export type QuestionnaireVersion = 'v1';

export type ProfileDimension =
  | 'attention'
  | 'executive_function'
  | 'task_management'
  | 'hyperactivity'
  | 'impulsivity'
  | 'emotional_regulation';

/** Raw answer value. 0 = Never … 4 = Almost always. */
export type ADHDAnswer = 0 | 1 | 2 | 3 | 4;

export interface ADHDQuestion {
  /** 1-based, matches the question_N database columns. */
  id: number;
  /** i18n key for the question text. */
  i18nKey: string;
  dimension: ProfileDimension;
}

export type ADHDProfileScores = Record<ProfileDimension, number>;

export interface ADHDProfile {
  answers: ADHDAnswer[];
  scores: ADHDProfileScores;
  questionnaireVersion: QuestionnaireVersion;
  completedAt: string;
}

export const QUESTIONNAIRE_VERSION: QuestionnaireVersion = 'v1';

export const ADHD_QUESTIONNAIRE: ADHDQuestion[] = [
  { id: 1, i18nKey: 'adhdProfile.questions.q1', dimension: 'attention' },
  { id: 2, i18nKey: 'adhdProfile.questions.q2', dimension: 'attention' },
  { id: 3, i18nKey: 'adhdProfile.questions.q3', dimension: 'executive_function' },
  { id: 4, i18nKey: 'adhdProfile.questions.q4', dimension: 'executive_function' },
  { id: 5, i18nKey: 'adhdProfile.questions.q5', dimension: 'task_management' },
  { id: 6, i18nKey: 'adhdProfile.questions.q6', dimension: 'task_management' },
  { id: 7, i18nKey: 'adhdProfile.questions.q7', dimension: 'hyperactivity' },
  { id: 8, i18nKey: 'adhdProfile.questions.q8', dimension: 'impulsivity' },
  { id: 9, i18nKey: 'adhdProfile.questions.q9', dimension: 'impulsivity' },
  { id: 10, i18nKey: 'adhdProfile.questions.q10', dimension: 'emotional_regulation' },
];

export const ANSWER_OPTIONS: { value: ADHDAnswer; i18nKey: string }[] = [
  { value: 0, i18nKey: 'adhdProfile.answers.never' },
  { value: 1, i18nKey: 'adhdProfile.answers.rarely' },
  { value: 2, i18nKey: 'adhdProfile.answers.sometimes' },
  { value: 3, i18nKey: 'adhdProfile.answers.often' },
  { value: 4, i18nKey: 'adhdProfile.answers.almostAlways' },
];

export const PROFILE_DIMENSIONS: ProfileDimension[] = [
  'attention',
  'executive_function',
  'task_management',
  'hyperactivity',
  'impulsivity',
  'emotional_regulation',
];

export const DIMENSION_I18N_KEY: Record<ProfileDimension, string> = {
  attention: 'adhdProfile.dimensions.attention',
  executive_function: 'adhdProfile.dimensions.executiveFunction',
  task_management: 'adhdProfile.dimensions.taskManagement',
  hyperactivity: 'adhdProfile.dimensions.hyperactivity',
  impulsivity: 'adhdProfile.dimensions.impulsivity',
  emotional_regulation: 'adhdProfile.dimensions.emotionalRegulation',
};

/**
 * Maps a 0-4 raw average onto the 1-10 profile scale, clamped.
 * avg 0 -> 1, avg 2 -> 6 (5.5 rounded), avg 4 -> 10.
 */
export function rawAverageToScore(average: number): number {
  const score = Math.round(1 + 9 * (average / 4));
  return Math.min(10, Math.max(1, score));
}

/** Score for one dimension from that dimension's raw answers. */
export function calculateDimensionScore(rawAnswers: ADHDAnswer[]): number {
  if (rawAnswers.length === 0) return 1;
  const sum = rawAnswers.reduce((acc, a) => acc + a, 0);
  return rawAverageToScore(sum / rawAnswers.length);
}

/**
 * Full profile from all 10 answers, indexed by question order
 * (answers[0] is question 1).
 */
export function calculateProfileScores(answers: ADHDAnswer[]): ADHDProfileScores {
  const byDimension = {} as Record<ProfileDimension, ADHDAnswer[]>;
  for (const dimension of PROFILE_DIMENSIONS) byDimension[dimension] = [];

  for (const question of ADHD_QUESTIONNAIRE) {
    const answer = answers[question.id - 1];
    if (answer === undefined) continue;
    byDimension[question.dimension].push(answer);
  }

  const scores = {} as ADHDProfileScores;
  for (const dimension of PROFILE_DIMENSIONS) {
    scores[dimension] = calculateDimensionScore(byDimension[dimension]);
  }
  return scores;
}

/** A score at or above this counts as a notable challenge area. */
export const HIGH_CHALLENGE_THRESHOLD = 7;

export function describeChallengeLevel(score: number): 'less' | 'moderate' | 'more' {
  if (score >= HIGH_CHALLENGE_THRESHOLD) return 'more';
  if (score >= 4) return 'moderate';
  return 'less';
}

/** Dimensions sorted by score, highest (most challenging) first. */
export function getTopChallengeAreas(scores: ADHDProfileScores, limit = 3): ProfileDimension[] {
  return [...PROFILE_DIMENSIONS].sort((a, b) => scores[b] - scores[a]).slice(0, limit);
}

/**
 * Which Onward features tend to suit each challenge area. Centralized
 * here so the result screen, dashboard suggestions and the AI's guidance
 * all stay in sync — change this mapping, not individual components.
 */
export type FeatureId = 'shredder' | 'focus' | 'dump' | 'decision' | 'chat';

export const DIMENSION_FEATURE_MAP: Record<ProfileDimension, FeatureId[]> = {
  attention: ['focus', 'dump'],
  executive_function: ['shredder', 'decision'],
  task_management: ['shredder', 'focus'],
  hyperactivity: ['focus'],
  impulsivity: ['decision'],
  emotional_regulation: ['dump', 'chat'],
};

/** Deduplicated feature suggestions for a profile, best-matching first. */
export function getRecommendedFeatures(scores: ADHDProfileScores, limit = 3): FeatureId[] {
  const recommended: FeatureId[] = [];
  for (const dimension of getTopChallengeAreas(scores, PROFILE_DIMENSIONS.length)) {
    for (const feature of DIMENSION_FEATURE_MAP[dimension]) {
      if (!recommended.includes(feature)) recommended.push(feature);
    }
  }
  return recommended.slice(0, limit);
}
