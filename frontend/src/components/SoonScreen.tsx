import { useEffect, useState } from 'react';

function formatRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SoonScreen({
  announcementAt,
  onLogout,
}: {
  announcementAt: string | null;
  onLogout: () => void;
}) {
  const target = announcementAt ? new Date(announcementAt) : null;
  const [clock, setClock] = useState(target ? formatRemaining(target) : '--:--:--');

  useEffect(() => {
    if (!target) return;
    const id = window.setInterval(() => setClock(formatRemaining(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">Chequered Flag</span>
        </div>
        <button className="btn btn-ghost" type="button" onClick={onLogout}>
          Выйти
        </button>
      </header>
      <div className="soon-screen">
        <div className="speed-lines" aria-hidden>
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              style={{
                top: `${12 + i * 10}%`,
                width: `${40 + (i % 3) * 20}%`,
                left: `${(i * 7) % 40}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
        <h1>СКОРО</h1>
        <p className="lead" style={{ margin: '0 auto' }}>
          Голосование завершено. Объявление результатов через:
        </p>
        <div className="countdown">{clock}</div>
      </div>
    </div>
  );
}
