import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { Button } from '../components/Button.jsx';
import { GlassCard } from '../components/GlassCard.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { fadeUp } from '../animations/variants.js';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const {
    isSubmitting,
    error,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signInAsGuest,
    sendPasswordReset,
  } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'forgot') {
      const ok = await sendPasswordReset(email);
      if (ok) setResetSent(true);
      return;
    }

    const ok = mode === 'signin' ? await signInWithPassword(email, password) : await signUpWithPassword(email, password);
    if (ok) navigate('/home');
  };

  const handleGoogle = async () => {
    await signInWithGoogle(); // redirects away; navigation happens on return
  };

  const handleGuest = async () => {
    const ok = await signInAsGuest();
    if (ok) navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-0 mt-0">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center mb-8 py-0">
        <AuroraOrb size={96} className="" />
        <h1 className="text-2xl font-display font-medium text-center">Evolve</h1>
        <p className="text-ink-muted text-sm mt-1 text-center">The AI Companion That Grows With You</p>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-sm">
        <GlassCard solid>
          {mode === 'forgot' && resetSent ? (
            <p className="text-sm text-ink-muted text-center py-2">
              Check your email for a password reset link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                autoComplete="email"
              />
              {mode !== 'forgot' && (
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              )}

              {error && <p className="text-sm text-aurora-rose">{error}</p>}

              <Button type="submit" disabled={isSubmitting} className="mt-1">
                {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {mode !== 'forgot' && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-ink-faint">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <Button variant="ghost" onClick={handleGoogle} disabled={isSubmitting} className="w-full">
                Continue with Google
              </Button>
              <Button variant="ghost" onClick={handleGuest} disabled={isSubmitting} className="w-full mt-2">
                Continue as Guest
              </Button>
            </>
          )}

          <div className="flex justify-center gap-4 mt-5 text-xs text-ink-faint">
            {mode !== 'signin' && (
              <button type="button" onClick={() => setMode('signin')} className="hover:text-ink-muted">
                Sign in
              </button>
            )}
            {mode !== 'signup' && (
              <button type="button" onClick={() => setMode('signup')} className="hover:text-ink-muted">
                Create account
              </button>
            )}
            {mode !== 'forgot' && (
              <button type="button" onClick={() => setMode('forgot')} className="hover:text-ink-muted">
                Forgot password?
              </button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
