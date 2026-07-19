import React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { memoryApi } from '../api/memoryApi.js';
import { MEMORY_CATEGORIES } from '../constants/relationship.js';
import { fadeUp, staggerChildren } from '../animations/variants.js';

const CATEGORY_ICONS = {
  goal: '🎯', dream: '✨', song: '🎵', movie: '🎬', book: '📖', birthday: '🎂',
  friend: '🧑\u200d🤝\u200d🧑', family: '🏡', achievement: '🏆', fear: '🌙',
  habit: '🔁', career: '💼', study_progress: '📚', health_preference: '🌿',
  inside_joke: '😄', important_moment: '⭐', other: '💭',
};

export default function Timeline() {
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    memoryApi
      .list(filter)
      .then((res) => setMemories(res.memories || []))
      .finally(() => setLoading(false));
  }, [filter]);

  const sorted = [...memories].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="min-h-screen pb-32 px-5 pt-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="font-display text-2xl mb-1">Your Timeline</h1>
        <p className="text-ink-muted text-sm mb-5">Every moment Evolve remembers, together.</p>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-5 px-5 no-scrollbar">
        <FilterChip label="All" active={!filter} onClick={() => setFilter(null)} />
        {MEMORY_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={`${CATEGORY_ICONS[c]} ${c.replace(/_/g, ' ')}`}
            active={filter === c}
            onClick={() => setFilter(c)}
          />
        ))}
      </div>

      {loading && <p className="text-center text-ink-faint text-sm py-10">Loading…</p>}

      {!loading && sorted.length === 0 && (
        <p className="text-center text-ink-faint text-sm py-10">
          Nothing here yet — your timeline fills in as we talk.
        </p>
      )}

      {!loading && sorted.length > 0 && (
        <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-aurora-violet via-aurora-teal to-transparent" />

          {sorted.map((m) => (
            <motion.div key={m.id} variants={fadeUp} className="relative mb-5">
              <div className="absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full bg-aurora-gradient border-2 border-void flex items-center justify-center text-[10px]">
                {CATEGORY_ICONS[m.category] || '💭'}
              </div>
              <GlassCard className="!py-3">
                <p className="text-xs text-ink-faint mb-1">
                  {new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  <span className="capitalize">{m.category.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-sm text-ink-primary">{m.content}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs capitalize border transition-colors whitespace-nowrap ${
        active ? 'border-aurora-violet/60 bg-white/[0.08] text-ink-primary' : 'border-white/10 text-ink-faint hover:text-ink-muted'
      }`}
    >
      {label}
    </button>
  );
}
