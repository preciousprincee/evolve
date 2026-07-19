import React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { Button } from '../components/Button.jsx';
import { RelationshipBadge } from '../components/RelationshipBadge.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { profileApi } from '../api/profileApi.js';
import { memoryApi } from '../api/memoryApi.js';
import { useAuthStore } from '../stores/authStore.js';
import { COMPANION_STYLES, LOVE_LANGUAGES } from '../constants/relationship.js';
import { fadeUp, staggerChildren } from '../animations/variants.js';

export default function Profile() {
  const { signOut } = useAuthStore();
  const [data, setData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const [profileRes, achievementsRes] = await Promise.all([
      profileApi.getMe(),
      memoryApi.list('achievement'),
    ]);
    setData(profileRes);
    setForm(profileRes.profile);
    setAchievements(achievementsRes.memories || []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setIsSaving(true);
    try {
      await profileApi.updateMe({
        nickname: form.nickname || undefined,
        career: form.career || undefined,
        companion_style: form.companion_style,
        love_language: form.love_language,
        current_mood: form.current_mood || undefined,
      });
      await load();
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <div className="min-h-screen pb-32 px-5 pt-0">
      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 mb-2">
          <AuroraOrb size={88} />
          <h1 className="font-display text-xl">{data.profile.nickname || data.profile.name}</h1>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard solid>
            <RelationshipBadge level={data.relationship.level} xp={data.relationship.xp} />
            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
              <div>
                <p className="text-lg font-semibold">{data.relationship.days_together}</p>
                <p className="text-xs text-ink-faint">days together</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{achievements.length}</p>
                <p className="text-xs text-ink-faint">achievements together</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium">About you</p>
              <button className="text-xs text-aurora-teal" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {!editing ? (
              <div className="flex flex-col gap-2 text-sm text-ink-muted">
                <p><span className="text-ink-faint">Career:</span> {data.profile.career || '—'}</p>
                <p><span className="text-ink-faint">Companion style:</span> {COMPANION_STYLES.find((s) => s.value === data.profile.companion_style)?.label || '—'}</p>
                <p><span className="text-ink-faint">Love language:</span> {LOVE_LANGUAGES.find((l) => l.value === data.profile.love_language)?.label || '—'}</p>
                <p><span className="text-ink-faint">Current mood:</span> {data.profile.current_mood || '—'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input className="input-field" placeholder="Nickname" value={form.nickname || ''} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
                <input className="input-field" placeholder="Career" value={form.career || ''} onChange={(e) => setForm({ ...form, career: e.target.value })} />
                <select className="input-field" value={form.companion_style || ''} onChange={(e) => setForm({ ...form, companion_style: e.target.value })}>
                  {COMPANION_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="input-field" value={form.love_language || ''} onChange={(e) => setForm({ ...form, love_language: e.target.value })}>
                  {LOVE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <input className="input-field" placeholder="Current mood" value={form.current_mood || ''} onChange={(e) => setForm({ ...form, current_mood: e.target.value })} />
                <Button onClick={save} disabled={isSaving} className="mt-1">{isSaving ? 'Saving…' : 'Save'}</Button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {achievements.length > 0 && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <p className="text-sm font-medium mb-2">Achievements together</p>
              <div className="flex flex-col gap-2">
                {achievements.slice(0, 5).map((a) => (
                  <p key={a.id} className="text-sm text-ink-muted">🏆 {a.content}</p>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <Button variant="ghost" onClick={signOut} className="w-full">
            Sign out
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
