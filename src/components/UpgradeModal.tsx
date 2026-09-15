import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Sparkles, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCryptoPayment, type PlanId } from '@/hooks/useCryptoPayment';

// Mirrors supabase/functions/crypto-verify/index.ts exactly — if either
// side changes (wallet, amounts, network), update both.
const RECEIVING_WALLET = '0xe0A40666797F83fACfEfB8be0401a76323bF3a56';
const PLAN_AMOUNTS: Record<PlanId, string> = {
  monthly: '7.99',
  yearly: '79.99',
  lifetime: '399.99',
};
const PLAN_ORDER: PlanId[] = ['monthly', 'yearly', 'lifetime'];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function UpgradeModal({ open, onClose, onVerified }: UpgradeModalProps) {
  const { t } = useTranslation();
  const { verify, isVerifying } = useCryptoPayment();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [showCryptoFlow, setShowCryptoFlow] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [walletCopied, setWalletCopied] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const reset = () => {
    setShowCryptoFlow(false);
    setTxHash('');
    setVerifyError(null);
    setVerifiedSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(RECEIVING_WALLET);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-secure context) — the
      // address is still selectable/readable on screen either way.
    }
  };

  const handleVerify = async () => {
    if (!txHash.trim()) return;
    setVerifyError(null);
    const result = await verify(txHash.trim(), selectedPlan);
    if (result.ok) {
      setVerifiedSuccess(true);
      onVerified();
    } else if ('error' in result) {
      setVerifyError(result.error);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-full max-w-sm"
          >
            {verifiedSuccess ? (
              <GlassCard hover={false} className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Sparkles size={28} />
                  </div>
                </div>
                <h2 className="mb-2 text-xl font-bold text-foreground">{t('upgrade.verifySuccessTitle')}</h2>
                <p className="mb-6 text-muted-foreground">{t('upgrade.verifySuccessBody')}</p>
                <Button className="w-full neon-glow" onClick={handleClose}>
                  {t('common.gotIt')}
                </Button>
              </GlassCard>
            ) : !showCryptoFlow ? (
              <>
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-xl font-bold text-foreground">{t('upgrade.title')}</h2>
                  <p className="text-sm text-muted-foreground">{t('upgrade.subtitle')}</p>
                </div>

                <div className="mb-4 space-y-3">
                  {PLAN_ORDER.map((plan) => {
                    const isSelected = selectedPlan === plan;
                    return (
                      <GlassCard
                        key={plan}
                        hover={false}
                        onClick={() => setSelectedPlan(plan)}
                        className={`cursor-pointer border-2 transition-all duration-150 ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-[0_0_16px_hsla(150,47%,71%,0.35)]'
                            : 'border-transparent hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                            }`}
                          >
                            {isSelected && <Check size={13} className="text-background" strokeWidth={3} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{t(`upgrade.plans.${plan}.name`)}</span>
                              {(plan === 'yearly' || plan === 'lifetime') && (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  {t(`upgrade.plans.${plan}.badge`)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{t(`upgrade.plans.${plan}.tagline`)}</p>
                          </div>
                          <span className="shrink-0 font-bold text-primary">{t(`upgrade.plans.${plan}.price`)}</span>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>

                <Button className="w-full neon-glow" onClick={() => setShowCryptoFlow(true)}>
                  <Wallet size={18} className="mr-2" />
                  {t('upgrade.payWithCrypto')}
                </Button>
                <button
                  onClick={handleClose}
                  className="mt-3 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('upgrade.maybeLater')}
                </button>
              </>
            ) : (
              <GlassCard hover={false}>
                <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-foreground">
                  {t('upgrade.cryptoInstructions')}
                </p>

                <div className="mb-4">
                  <label className="mb-1 block text-xs text-muted-foreground">{t('upgrade.amountLabel')}</label>
                  <div className="font-mono text-lg font-bold text-primary">
                    {PLAN_AMOUNTS[selectedPlan]} USDT
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-xs text-muted-foreground">{t('upgrade.walletLabel')}</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-2">
                    <span className="flex-1 truncate font-mono text-xs text-foreground">{RECEIVING_WALLET}</span>
                    <button
                      onClick={copyWallet}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                      aria-label={t('upgrade.copy')}
                    >
                      {walletCopied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-xs text-muted-foreground">{t('upgrade.txHashLabel')}</label>
                  <Input
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder={t('upgrade.txHashPlaceholder')}
                    className="font-mono text-sm"
                  />
                </div>

                {verifyError && (
                  <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    <span className="font-semibold">{t('upgrade.verifyFailedTitle')}:</span> {verifyError}
                  </p>
                )}

                <Button
                  className="w-full neon-glow"
                  onClick={handleVerify}
                  disabled={!txHash.trim() || isVerifying}
                >
                  {isVerifying ? t('upgrade.verifying') : t('upgrade.verifyButton')}
                </Button>
                <button
                  onClick={() => setShowCryptoFlow(false)}
                  className="mt-3 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('common.back')}
                </button>
              </GlassCard>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
