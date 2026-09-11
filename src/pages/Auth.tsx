import { motion } from 'framer-motion';
import { Sparkles, Heart, Loader2 } from 'lucide-react';
import onwardLogo from '@/assets/onward-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, Trans } from 'react-i18next';

const Auth = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSignIn = async (provider: 'google') => {
    setLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: t('auth.signInFailed'), description: error.message, variant: 'destructive' });
        setLoading(null);
      }
      // On success, Supabase redirects the browser to the provider's
      // consent screen, so there's nothing else to do here.
    } catch {
      toast({ title: t('auth.somethingWrong'), variant: 'destructive' });
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading('email');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          toast({ title: t('auth.signUpFailed'), description: error.message, variant: 'destructive' });
        } else if (!data.session) {
          // Email confirmation is required before the account is usable.
          toast({ title: t('auth.checkEmailTitle'), description: t('auth.checkEmailBody') });
        }
        // If a session came back immediately (confirmation disabled),
        // the auth-state listener in useAuth picks it up and the app
        // navigates on its own — nothing else to do here.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: t('auth.signInFailed'), description: error.message, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: t('auth.somethingWrong'), variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/10 blur-[80px]" />

      <motion.div
        className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Logo & Title */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-24 h-24 mx-auto mb-4">
            <img src={onwardLogo} alt="Onward Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_hsla(150,47%,71%,0.4)]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground neon-text tracking-tight">
            Onward
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('auth.tagline')}</p>
        </motion.div>

        {/* ADHD Creator Badge */}
        <motion.div
          className="glass-card rounded-xl p-4 text-center w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart size={16} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              {t('auth.builtDifferent')}
            </span>
            <Heart size={16} className="text-primary" />
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            <Trans
              i18nKey="auth.adhdStatement"
              components={{
                1: <span className="text-primary font-semibold" />,
                2: <em />,
              }}
            />
          </p>
        </motion.div>

        {/* Sign In Buttons */}
        <motion.div
          className="w-full flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="w-full h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-xl gap-3"
          >
            {loading === 'google' ? (
              <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{t('auth.or')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email')}
              autoComplete="email"
              required
              className="h-12 rounded-xl"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              className="h-12 rounded-xl"
            />
            <Button
              type="submit"
              disabled={loading !== null}
              variant="secondary"
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              {loading === 'email' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === 'signup' ? (
                t('auth.signUp')
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors text-center"
          >
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
        </motion.div>

        {/* Powered By Section */}
        <motion.div
          className="flex flex-col items-center gap-3 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest">{t('auth.poweredBy')}</span>
          <div className="flex items-center gap-4">
            {/* Claude Icon */}
            <div className="flex items-center gap-1.5 glass-card rounded-lg px-3 py-1.5">
              <Sparkles size={16} style={{ color: '#D97757' }} />
              <span className="text-sm font-semibold text-foreground">Claude</span>
            </div>
            <span className="text-muted-foreground text-xs">&</span>
            {/* DeepSeek Icon */}
            <div className="flex items-center gap-1.5 glass-card rounded-lg px-3 py-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M12 2C12 2 14.5 6.5 18 8C14.5 9.5 12 14 12 14C12 14 9.5 9.5 6 8C9.5 6.5 12 2 12 2Z" fill="hsl(150, 47%, 71%)" />
                <path d="M12 14C12 14 13.5 17 16 18C13.5 19 12 22 12 22C12 22 10.5 19 8 18C10.5 17 12 14 12 14Z" fill="hsl(150, 47%, 71%)" opacity="0.6" />
              </svg>
              <span className="text-sm font-semibold text-foreground">DeepSeek</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
