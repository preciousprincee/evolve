import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard.jsx';
import { Button } from '../components/Button.jsx';
import { RelationshipBadge } from '../components/RelationshipBadge.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { profileApi } from '../api/profileApi.js';
import { memoryApi } from '../api/memoryApi.js';
import { useAuthStore } from '../stores/authStore.js';
import { useProfileStore } from '../stores/profileStore.js';
import { COMPANION_STYLES, LOVE_LANGUAGES, GENDER_OPTIONS } from '../constants/relationship.js';
import { fadeUp, staggerChildren } from '../animations/variants.js';

export default function Profile() {
  const { signOut } = useAuthStore();
  const [data, setData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [romanticSaving, setRomanticSaving] = useState(false);
  const [romanticError, setRomanticError] = useState('');
  const [saveError, setSaveError] = useState('');

  const load = async () => {
    const [profileRes, achievementsRes] = await Promise.all([
      useProfileStore.getState().fetch(),
      memoryApi.list('achievement'),
    ]);
    setData(profileRes);
    setForm(profileRes.profile);
    setAchievements(achievementsRes.memories || []);
  };

  // After any write, force the shared store to refetch — this is what
  // keeps Chat/Home in sync with changes made here without them each
  // polling independently.
  const reloadAfterWrite = async () => {
    const profileRes = await useProfileStore.getState().refresh();
    setData(profileRes);
    setForm(profileRes.profile);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await profileApi.updateMe({
        nickname: form.nickname || undefined,
        age: form.age || undefined,
        gender: form.gender || undefined,
        career: form.career || undefined,
        companion_style: form.companion_style || undefined,
        love_language: form.love_language || undefined,
        current_mood: form.current_mood || undefined,
      });
      await reloadAfterWrite();
      setEditing(false);
    } catch (err) {
      // Previously unhandled — a validation failure (e.g. an empty select
      // field) would silently no-op here, so a field like age could look
      // "saved" in the UI while nothing actually reached the server.
      setSaveError(err?.message || 'Could not save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasAge = data?.profile?.age !== null && data?.profile?.age !== undefined;
  const isAdult = Number(data?.profile?.age) >= 18;

  const toggleRomanticMode = async () => {
    setRomanticError('');

    // Not eligible yet — surface a message instead of silently doing
    // nothing. This is purely informational UX; the actual restriction
    // is enforced server-side regardless of what happens here.
    if (!isAdult) {
      setRomanticError(
        hasAge
          ? 'Romantic Mode is only available to users 18 and older.'
          : 'Add your age to your profile to enable Romantic Mode.'
      );
      return;
    }

    setRomanticSaving(true);
    try {
      await profileApi.updateMe({ romantic_mode_enabled: !data.profile.romantic_mode_enabled });
      await reloadAfterWrite();
    } catch (err) {
      setRomanticError(
        err?.code === 'ROMANTIC_MODE_AGE_RESTRICTED'
          ? 'Romantic Mode is only available to users 18 and older.'
          : 'Could not update Romantic Mode. Please try again.'
      );
    } finally {
      setRomanticSaving(false);
    }
  };

  if (!data) {
    // Previously this returned null: a totally blank screen with none of
    // the page's padding/cards, followed by the entire padded layout
    // (outer pb-32/px-5/pt-8 + every GlassCard's p-5) popping in at once
    // the instant the profile GET resolves. That sudden jump from "no
    // padding at all" to "the full stack of card padding" is what reads
    // as excess margin/padding appearing on load. Rendering the same
    // shell with skeleton placeholders keeps the spacing constant so
    // nothing shifts when the real content arrives.
    return (
      <div className="min-h-screen pb-32 px-5 pt-8">
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-[88px] h-[88px] rounded-full bg-white/10" />
            <div className="w-32 h-5 rounded bg-white/10" />
          </div>
          <div className="glass-panel-solid p-5">
            <div className="w-24 h-4 rounded bg-white/10 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded bg-white/10" />
              <div className="h-10 rounded bg-white/10" />
            </div>
          </div>
          <div className="glass-panel p-5">
            <div className="w-20 h-4 rounded bg-white/10 mb-3" />
            <div className="flex flex-col gap-2">
              <div className="h-3 rounded bg-white/10 w-3/4" />
              <div className="h-3 rounded bg-white/10 w-1/2" />
              <div className="h-3 rounded bg-white/10 w-2/3" />
            </div>
          </div>
          <div className="glass-panel p-5 h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-5 pt-8">
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
                <p><span className="text-ink-faint">Age:</span> {data.profile.age ?? '—'}</p>
                <p><span className="text-ink-faint">Gender:</span> {GENDER_OPTIONS.find((g) => g.value === data.profile.gender)?.label || '—'}</p>
                <p><span className="text-ink-faint">Career:</span> {data.profile.career || '—'}</p>
                <p><span className="text-ink-faint">Companion style:</span> {COMPANION_STYLES.find((s) => s.value === data.profile.companion_style)?.label || '—'}</p>
                <p><span className="text-ink-faint">Love language:</span> {LOVE_LANGUAGES.find((l) => l.value === data.profile.love_language)?.label || '—'}</p>
                <p><span className="text-ink-faint">Current mood:</span> {data.profile.current_mood || '—'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input className="input-field" placeholder="Nickname" value={form.nickname || ''} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
                <input className="input-field" type="number" min="13" max="120" placeholder="Age" value={form.age ?? ''} onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })} />
                <select className="input-field" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Gender — not set</option>
                  {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
                <input className="input-field" placeholder="Career" value={form.career || ''} onChange={(e) => setForm({ ...form, career: e.target.value })} />
                <select className="input-field" value={form.companion_style || ''} onChange={(e) => setForm({ ...form, companion_style: e.target.value })}>
                  <option value="">Companion style — not set</option>
                  {COMPANION_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="input-field" value={form.love_language || ''} onChange={(e) => setForm({ ...form, love_language: e.target.value })}>
                  <option value="">Love language — not set</option>
                  {LOVE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <input className="input-field" placeholder="Current mood" value={form.current_mood || ''} onChange={(e) => setForm({ ...form, current_mood: e.target.value })} />
                {saveError && <p className="text-xs text-aurora-rose px-1">{saveError}</p>}
                <Button onClick={save} disabled={isSaving} className="mt-1">{isSaving ? 'Saving…' : 'Save'}</Button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex justify-between items-center gap-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <span className="text-aurora-rose">♥</span> Romantic Mode
                </p>
                <p className="text-xs text-ink-faint mt-1 max-w-[80%]">
                  A warmer, more affectionate tone in chat.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={Boolean(data.profile.romantic_mode_enabled)}
                aria-label="Toggle Romantic Mode"
                disabled={romanticSaving}
                onClick={toggleRomanticMode}
                className={`w-12 h-7 shrink-0 rounded-full transition-colors relative disabled:cursor-wait ${
                  isAdult ? '' : 'opacity-40'
                } ${data.profile.romantic_mode_enabled ? 'bg-romantic-gradient' : 'bg-white/10'}`}
              >
                <span
                  className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow-glass transition-transform duration-200 ${
                    data.profile.romantic_mode_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {romanticError && (
              <div className="mt-3 text-xs text-ink-primary bg-aurora-rose/10 border border-aurora-rose/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span>{romanticError}</span>
                {!hasAge && (
                  <button
                    onClick={() => { setRomanticError(''); setEditing(true); }}
                    className="text-aurora-rose font-medium shrink-0 underline underline-offset-2"
                  >
                    Add age
                  </button>
                )}
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
          {data.profile.role === 'admin' && (
            <motion.div variants={fadeUp}>
              <Link to="/admin/users">
                <Button variant="ghost" className="w-full">Admin dashboard</Button>
              </Link>
            </motion.div>
          )}

          <Button variant="ghost" onClick={signOut} className="w-full">
            Sign out
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
