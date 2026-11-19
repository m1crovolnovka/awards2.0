import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import * as api from '../api/endpoints';
import { AuthImage } from '../components/AuthImage';
import { SoonScreen } from '../components/SoonScreen';
import { useAuth } from '../hooks/AuthContext';
import type { NominationCard, VotingStatus } from '../types';

export function NominationPage() {
  const { id } = useParams();
  const nominationId = Number(id);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<NominationCard | null>(null);
  const [status, setStatus] = useState<VotingStatus | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [enterKey, setEnterKey] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const [n, st] = await Promise.all([
          api.getNomination(nominationId),
          api.getVotingStatus(),
        ]);
        setItem(n);
        setStatus(st);
        setSelected(n.myVoteNomineeId);
        setEnterKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка');
      }
    })();
  }, [nominationId]);

  if (status && !status.votingOpen) {
    return <SoonScreen announcementAt={status.announcementAt} onLogout={logout} />;
  }

  const vote = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.castVote(nominationId, selected);
      setMessage('Голос сохранён');
      const refreshed = await api.getNomination(nominationId);
      setItem(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проголосовать');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">Category</span>
        </div>
        <div className="actions">
          <Link className="btn btn-ghost" to="/vote">
            К номинациям
          </Link>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="page">
        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        <AnimatePresence mode="wait">
          {item && (
            <motion.div
              key={`${item.id}-${enterKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="category-stage">
                <div className="speed-lines" aria-hidden>
                  {[...Array(10)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        top: `${8 + i * 9}%`,
                        width: `${35 + (i % 4) * 15}%`,
                        left: `${(i * 11) % 50}%`,
                        animationDelay: `${0.05 * i}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="category-big-title">{item.title}</div>
                <div className="f1-car" aria-hidden />
                <div className="category-foreground">
                  <motion.h1
                    className="hero-title"
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.55 }}
                  >
                    {item.title}
                  </motion.h1>
                  <motion.p
                    className="lead"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    {item.description}
                  </motion.p>
                </div>
              </div>

              <div className="nominees-grid">
                {item.nominees.map((n, i) => (
                  <motion.button
                    key={n.id}
                    type="button"
                    className={`nominee-card ${selected === n.id ? 'selected' : ''}`}
                    onClick={() => setSelected(n.id)}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                  >
                    <AuthImage src={n.imageUrl} alt={n.name} />
                    <h3>{n.name}</h3>
                  </motion.button>
                ))}
              </div>

              <div className="actions" style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={!selected || saving}
                  onClick={() => void vote()}
                >
                  {saving ? 'Сохранение…' : 'Проголосовать'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => navigate('/vote')}>
                  Назад
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
