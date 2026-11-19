import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as api from '../api/endpoints';
import { AuthImage } from '../components/AuthImage';
import { useAuth } from '../hooks/AuthContext';
import type { NominationCard, VotingStatus } from '../types';
import { SoonScreen } from '../components/SoonScreen';

export function VoteHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NominationCard[]>([]);
  const [status, setStatus] = useState<VotingStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [noms, st] = await Promise.all([api.listNominations(), api.getVotingStatus()]);
        setItems(noms);
        setStatus(st);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      }
    })();
  }, []);

  if (status && !status.votingOpen) {
    return <SoonScreen announcementAt={status.announcementAt} onLogout={logout} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">{user?.firstName || user?.username || 'Driver'}</span>
        </div>
        <button className="btn btn-ghost" type="button" onClick={logout}>
          Выйти
        </button>
      </header>

      <main className="page">
        <motion.h1
          className="hero-title"
          style={{ fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', marginBottom: '0.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Номинации
        </motion.h1>
        <p className="lead">Выберите категорию. Один голос — один номинант.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="noms-rail" style={{ marginTop: '1.5rem' }}>
          {items.map((n, i) => (
            <motion.article
              key={n.id}
              className="nom-card"
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              onClick={() => navigate(`/vote/${n.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/vote/${n.id}`)}
            >
              <div className="nom-card-body">
                <div>
                  <h2>{n.title}</h2>
                  <p>{n.description}</p>
                  {n.myVoteNomineeId && <span className="voted-chip">Голос учтён</span>}
                </div>
                <Link to={`/vote/${n.id}`} onClick={(e) => e.stopPropagation()}>
                  <span className="btn btn-primary">Открыть</span>
                </Link>
              </div>
              <div className="nom-card-media">
                <AuthImage src={n.imageUrl} alt={n.title} />
              </div>
            </motion.article>
          ))}
          {items.length === 0 && !error && (
            <div className="panel">Номинации ещё не добавлены.</div>
          )}
        </div>
      </main>
    </div>
  );
}
