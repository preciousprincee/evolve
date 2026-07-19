import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { Button } from '../components/Button.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { profileApi } from '../api/profileApi.js';
import { COMPANION_STYLES, LOVE_LANGUAGES } from '../constants/relationship.js';
import { fadeUp } from '../animations/variants.js';

const STEPS = ['name', 'about', 'style'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    career: '',
    companion_style: 'supportive',
    love_language: 'quality_time',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const finish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await profileApi.updateMe(form);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <AuroraOrb size={72} className="mb-6" />

      <motion.div key={step} variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-sm">
        <GlassCard solid>
          {STEPS[step] === 'name' && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-display mb-1">What should I call you?</h2>
              <input className="input-field" placeholder="Your name" value={form.name} onChange={update('name')} />
              <input className="input-field" placeholder="Nickname (optional)" value={form.nickname} onChange={update('nickname')} />
            </div>
          )}

          {STEPS[step] === 'about' && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-display mb-1">What do you do?</h2>
              <input className="input-field" placeholder="Career or field of study" value={form.career} onChange={update('career')} />
              <label className="text-sm text-ink-muted mt-1">What makes you feel most cared for?</label>
              <select className="input-field" value={form.love_language} onChange={update('love_language')}>
                {LOVE_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          )}

          {STEPS[step] === 'style' && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-display mb-1">How should I be with you?</h2>
              <div className="grid grid-cols-1 gap-2">
                {COMPANION_STYLES.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => setForm((f) => ({ ...f, companion_style: s.value }))}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      form.companion_style === s.value
                        ? 'border-aurora-violet/60 bg-white/[0.08]'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-aurora-rose mt-3">{error}</p>}

          <Button onClick={next} disabled={isSaving} className="w-full mt-5">
            {isSaving ? 'Saving…' : step < STEPS.length - 1 ? 'Continue' : "Let's begin"}
          </Button>
        </GlassCard>

        <div className="flex justify-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-aurora-violet' : 'w-1.5 bg-white/15'}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
