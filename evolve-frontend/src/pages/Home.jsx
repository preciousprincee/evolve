import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { RelationshipBadge } from '../components/RelationshipBadge.jsx';
import { Button } from '../components/Button.jsx';
import { profileApi } from '../api/profileApi.js';
import { memoryApi } from '../api/memoryApi.js';
import { fadeUp, staggerChildren } from '../animations/variants.js';

const QUOTES = [
  'Small steps, taken daily, are what turn into a life you\u2019re proud of.',
  'You don\u2019t have to feel ready to begin \u2014 you just have to begin.',
  'Progress rarely feels dramatic while you\u2019re in it. Trust it anyway.',
  'The version of you a year from now is built today, quietly.',
  'Rest is not the opposite of progress \u2014 it\u2019s part of it.',
];

const SUGGESTIONS = [
  'How has today actually felt, underneath the surface?',
  'What\u2019s one thing on your mind you haven\u2019t said out loud yet?',
  'Want to check in on how that goal is going?',
  'Tell me something small that went right today.',
];

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentMemory, setRecentMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [suggestion] = useState(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, memoriesRes] = await Promise.all([profileApi.getMe(), memoryApi.list()]);
        setData(profileRes);
        setRecentMemory(memoriesRes.memories?.[0] ?? null);
      } catch {
        // Non-fatal — Home renders gracefully with partial/empty state.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const name = data?.profile?.nickname || data?.profile?.name || 'there';
  const level = data?.relationship?.level || 'Stranger';
  const xp = data?.relationship?.xp ?? 0;
  const streak = data?.relationship?.conversation_streak ?? 0;
  const daysTogether = data?.relationship?.days_together ?? 0;
  const mood = data?.profile?.current_mood || 'curious';

  return (
    <div className="relative min-h-screen pb-32 px-5 pt-8 overflow-hidden">
      <AuroraOrb size={420} className="absolute -top-32 -right-32 opacity-40 pointer-events-none" />

      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="relative flex flex-col gap-4">
        <motion.div variants={fadeUp}>
          <p className="text-ink-muted text-sm">Welcome back,</p>
          <h1 className="text-2xl font-display">{name}</h1>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard solid>
            <RelationshipBadge level={level} xp={xp} />
            <div className="flex justify-between mt-4 text-center">
              <div>
                <p className="text-lg font-semibold">{streak}</p>
                <p className="text-xs text-ink-faint">day streak</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{daysTogether}</p>
                <p className="text-xs text-ink-faint">days together</p>
              </div>
              <div>
                <p className="text-lg font-semibold capitalize">{loading ? '…' : mood}</p>
                <p className="text-xs text-ink-faint">current mood</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-xs text-ink-faint mb-1">Today's thought</p>
            <p className="font-display text-lg leading-snug">{quote}</p>
          </GlassCard>
        </motion.div>

        {recentMemory && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <p className="text-xs text-ink-faint mb-1">I remember</p>
              <p className="text-sm text-ink-primary">{recentMemory.content}</p>
            </GlassCard>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <GlassCard className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">{suggestion}</p>
            <Button className="!px-4 !py-2 text-sm shrink-0" onClick={() => navigate('/chat')}>
              Talk
            </Button>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
