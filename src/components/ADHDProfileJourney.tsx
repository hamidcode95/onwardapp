import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { ArrowRight, ArrowLeft, Sparkles, Scissors, Clock, Brain, Shuffle, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Oly } from '@/components/Oly';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import {
  ADHD_QUESTIONNAIRE,
  ANSWER_OPTIONS,
  PROFILE_DIMENSIONS,
  DIMENSION_I18N_KEY,
  ADHDAnswer,
  ADHDProfileScores,
  FeatureId,
  calculateProfileScores,
  describeChallengeLevel,
  getTopChallengeAreas,
  getRecommendedFeatures,
} from '@/lib/adhdProfile';

const DRAFT_KEY = 'onward_adhd_profile_draft';

const FEATURE_ICONS: Record<FeatureId, React.ReactNode> = {
  shredder: <Scissors size={20} />,
  focus: <Clock size={20} />,
  dump: <Brain size={20} />,
  decision: <Shuffle size={20} />,
  chat: <MessageCircle size={20} />,
};

function loadDraft(): (ADHDAnswer | null)[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return Array(ADHD_QUESTIONNAIRE.length).fill(null);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === ADHD_QUESTIONNAIRE.length) return parsed;
  } catch {
    // Corrupt draft — start fresh rather than block the Journey.
  }
  return Array(ADHD_QUESTIONNAIRE.length).fill(null);
}

interface ADHDProfileJourneyProps {
  onSubmit: (answers: ADHDAnswer[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  onDone: () => void;
}

type Stage = 'welcome' | 'question' | 'result';

export function ADHDProfileJourney({ onSubmit, onDone }: ADHDProfileJourneyProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>('welcome');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(ADHDAnswer | null)[]>(loadDraft);
  const [scores, setScores] = useState<ADHDProfileScores | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Persist in-progress answers so closing/reloading mid-Journey doesn't
  // lose them — the Journey is only marked complete once all 10 are
  // answered AND the save to Supabase succeeds (see handleAnswer).
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
  }, [answers]);

  const currentQuestion = ADHD_QUESTIONNAIRE[questionIndex];
  const isLastQuestion = questionIndex === ADHD_QUESTIONNAIRE.length - 1;

  const handleAnswer = async (value: ADHDAnswer) => {
    const next = [...answers];
    next[questionIndex] = value;
    setAnswers(next);

    if (!isLastQuestion) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    // All 10 answered — save now, only advance to the result on success.
    setIsSaving(true);
    setSaveError(null);
    const finalAnswers = next as ADHDAnswer[];
    const result = await onSubmit(finalAnswers);
    setIsSaving(false);
    if (result.ok) {
      localStorage.removeItem(DRAFT_KEY);
      setScores(calculateProfileScores(finalAnswers));
      setStage('result');
    } else if ('error' in result) {
      setSaveError(result.error);
    }
  };

  const topAreas = useMemo(() => (scores ? getTopChallengeAreas(scores, 3) : []), [scores]);
  const recommendedFeatures = useMemo(
    () => (scores ? getRecommendedFeatures(scores, 3) : []),
    [scores],
  );

  const radarData = useMemo(
    () =>
      scores
        ? PROFILE_DIMENSIONS.map((dimension) => ({
            dimension: t(DIMENSION_I18N_KEY[dimension]),
            score: scores[dimension],
          }))
        : [],
    [scores, t],
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <div className="mx-auto min-h-full max-w-md px-5 py-8">
        <AnimatePresence mode="wait">
          {stage === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex min-h-[80vh] flex-col items-center justify-center text-center"
            >
              <div className="mb-6">
                <Oly state="neutral" size={130} />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground">{t('adhdProfile.welcome.title')}</h1>
              <p className="mb-2 text-muted-foreground">{t('adhdProfile.welcome.subtitle')}</p>
              <p className="mb-8 text-sm text-muted-foreground/70">{t('adhdProfile.welcome.note')}</p>
              <Button size="lg" className="neon-glow w-full" onClick={() => setStage('question')}>
                {t('adhdProfile.welcome.start')}
                <ArrowRight size={18} className="ms-2" />
              </Button>
            </motion.div>
          )}

          {stage === 'question' && (
            <motion.div
              key={`question-${questionIndex}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-[85vh] flex-col justify-center"
            >
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t('adhdProfile.progress', { current: questionIndex + 1, total: ADHD_QUESTIONNAIRE.length })}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${((questionIndex + 1) / ADHD_QUESTIONNAIRE.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <h2 className="mb-8 text-xl font-semibold leading-relaxed text-foreground">
                {t(currentQuestion.i18nKey)}
              </h2>

              <div className="space-y-3">
                {ANSWER_OPTIONS.map((option) => {
                  const isSelected = answers[questionIndex] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAnswer(option.value)}
                      disabled={isSaving}
                      className={`w-full rounded-xl border-2 p-4 text-start text-base font-medium transition-all disabled:opacity-50 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background/40 text-foreground hover:border-primary/40'
                      }`}
                    >
                      {t(option.i18nKey)}
                    </button>
                  );
                })}
              </div>

              {isSaving && (
                <p className="mt-4 text-center text-sm text-muted-foreground">…</p>
              )}
              {saveError && (
                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
                  {saveError}
                </p>
              )}

              {questionIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestionIndex((i) => i - 1)}
                  disabled={isSaving}
                  className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  {t('adhdProfile.back')}
                </button>
              )}
            </motion.div>
          )}

          {stage === 'result' && scores && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4"
            >
              <div className="mb-6 text-center">
                <div className="mb-4 flex justify-center">
                  <Oly state="success" size={100} />
                </div>
                <p className="mb-1 text-sm font-medium text-primary">{t('adhdProfile.result.ready')}</p>
                <h1 className="mb-2 text-xl font-bold text-foreground">{t('adhdProfile.result.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('adhdProfile.result.subtitle')}</p>
              </div>

              <GlassCard hover={false} className="mb-6">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="hsl(150, 20%, 30%)" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: 'hsl(150, 15%, 75%)', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        domain={[1, 10]}
                        tick={{ fill: 'hsl(150, 15%, 50%)', fontSize: 9 }}
                        tickCount={6}
                      />
                      <Radar
                        dataKey="score"
                        stroke="hsl(150, 47%, 61%)"
                        fill="hsl(150, 47%, 61%)"
                        fillOpacity={0.35}
                        animationDuration={800}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-1.5 border-t border-border pt-4">
                  {PROFILE_DIMENSIONS.map((dimension) => (
                    <div key={dimension} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t(DIMENSION_I18N_KEY[dimension])}</span>
                      <span className="font-semibold text-foreground">
                        {scores[dimension]}/10{' '}
                        <span className="font-normal text-muted-foreground">
                          · {t(`adhdProfile.challengeLevel.${describeChallengeLevel(scores[dimension])}`)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <h3 className="mb-3 text-lg font-semibold text-foreground">{t('adhdProfile.result.topAreas')}</h3>
              <div className="mb-6 space-y-2">
                {topAreas.map((dimension) => (
                  <GlassCard key={dimension} hover={false}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-foreground">{t(DIMENSION_I18N_KEY[dimension])}</span>
                      <span className="font-bold text-primary">{scores[dimension]}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(`adhdProfile.insights.${dimension}`)}</p>
                  </GlassCard>
                ))}
              </div>

              <h3 className="mb-3 text-lg font-semibold text-foreground">{t('adhdProfile.result.howCanHelp')}</h3>
              <div className="mb-6 space-y-2">
                {recommendedFeatures.map((feature) => (
                  <GlassCard key={feature} hover={false}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        {FEATURE_ICONS[feature]}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{t(`adhdProfile.featureCards.${feature}.title`)}</h4>
                        <p className="text-xs text-muted-foreground">
                          {t(`adhdProfile.featureCards.${feature}.description`)}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <p className="mb-6 text-center text-xs text-muted-foreground/70">
                {t('adhdProfile.result.disclaimer')}
              </p>

              <Button size="lg" className="neon-glow w-full" onClick={onDone}>
                <Sparkles size={18} className="me-2" />
                {t('adhdProfile.result.cta')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
