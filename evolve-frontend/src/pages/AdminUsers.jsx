import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { adminApi } from '../api/adminApi.js';
import { fadeUp, staggerChildren } from '../animations/variants.js';

export default function AdminUsers() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listUsers({ page, pageSize: 25, search });
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const runSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleExpand = async (userId) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(userId);
    setDetail(null);
    const res = await adminApi.getUser(userId);
    setDetail(res);
  };

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="min-h-screen px-5 pt-8 pb-24 flex flex-col gap-4"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <AuroraOrb size={36} />
        <div>
          <h1 className="font-display text-lg leading-none">Admin</h1>
          <p className="text-xs text-ink-faint mt-0.5">{result ? `${result.total} users` : ' '}</p>
        </div>
      </motion.div>

      <motion.form variants={fadeUp} onSubmit={runSearch} className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Search by name or nickname…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-ghost px-4">Search</button>
      </motion.form>

      {isLoading && !result && (
        <div className="flex-1 flex items-center justify-center">
          <AuroraOrb size={64} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {result?.users.map((u) => (
          <motion.div key={u.id} variants={fadeUp}>
            <GlassCard className="cursor-pointer" onClick={() => toggleExpand(u.id)}>
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.nickname || u.name || 'Unnamed'}
                    {u.is_guest && <span className="text-ink-faint font-normal"> · guest</span>}
                    {u.role === 'admin' && <span className="text-aurora-teal font-normal"> · admin</span>}
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {u.relationship ? `${u.relationship.level} · ${u.relationship.xp} XP · ${u.relationship.days_together}d` : 'no relationship data'}
                    {u.credits ? ` · ${u.credits.balance} credits` : ''}
                  </p>
                </div>
                <p className="text-xs text-ink-faint shrink-0">{new Date(u.created_at).toLocaleDateString()}</p>
              </div>

              {expandedId === u.id && (
                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-ink-muted flex flex-col gap-1.5">
                  {!detail ? (
                    <p className="text-ink-faint">Loading…</p>
                  ) : (
                    <>
                      <p><span className="text-ink-faint">Email:</span> {detail.auth?.email || '—'}</p>
                      <p><span className="text-ink-faint">Age:</span> {detail.profile.age ?? '—'}</p>
                      <p><span className="text-ink-faint">Career:</span> {detail.profile.career || '—'}</p>
                      <p><span className="text-ink-faint">Companion style:</span> {detail.profile.companion_style || '—'}</p>
                      <p><span className="text-ink-faint">Love language:</span> {detail.profile.love_language || '—'}</p>
                      <p><span className="text-ink-faint">Romantic Mode:</span> {detail.profile.romantic_mode_enabled ? 'on' : 'off'}</p>
                      <p><span className="text-ink-faint">Messages:</span> {detail.messageCount} · <span className="text-ink-faint">Memories:</span> {detail.memoryCount}</p>
                      <p><span className="text-ink-faint">Last sign-in:</span> {detail.auth?.lastSignInAt ? new Date(detail.auth.lastSignInAt).toLocaleString() : '—'}</p>
                      <p><span className="text-ink-faint">Joined:</span> {new Date(detail.profile.created_at).toLocaleString()}</p>
                    </>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {result && result.totalPages > 1 && (
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mt-2">
          <button
            className="btn-ghost px-4 disabled:opacity-30"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <p className="text-xs text-ink-faint">{page} / {result.totalPages}</p>
          <button
            className="btn-ghost px-4 disabled:opacity-30"
            disabled={page >= result.totalPages}
            onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
          >
            Next
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
