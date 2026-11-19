import { useCallback, useEffect, useState, type FormEvent } from 'react';
import * as api from '../api/endpoints';
import { AuthImage } from '../components/AuthImage';
import { useAuth } from '../hooks/AuthContext';
import type { NominationCard, NominationStats, NomineeAdminView, VotingStatus } from '../types';

type Tab = 'stats' | 'nominations' | 'nominees' | 'reports' | 'account';

export function AdminDashboard() {
  const { logout, loginWithToken, user } = useAuth();
  const [tab, setTab] = useState<Tab>('stats');
  const [status, setStatus] = useState<VotingStatus | null>(null);
  const [stats, setStats] = useState<NominationStats[]>([]);
  const [nominations, setNominations] = useState<NominationCard[]>([]);
  const [nominees, setNominees] = useState<NomineeAdminView[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openTie, setOpenTie] = useState<number | null>(null);
  const [announcementLocal, setAnnouncementLocal] = useState('');

  const [nomineeForm, setNomineeForm] = useState({ name: '', reportName: '', image: null as File | null });
  const [nominationForm, setNominationForm] = useState({
    title: '',
    description: '',
    image: null as File | null,
    nomineeIds: [] as number[],
  });
  const [credForm, setCredForm] = useState({
    currentPassword: '',
    newLogin: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [credSaving, setCredSaving] = useState(false);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [st, stStats, noms, nomsList] = await Promise.all([
        api.adminVotingStatus(),
        api.adminStats(),
        api.adminNominees(),
        api.adminNominations(),
      ]);
      setStatus(st);
      setStats(stStats);
      setNominees(noms);
      setNominations(nomsList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const onEndVoting = async () => {
    try {
      const iso = announcementLocal ? new Date(announcementLocal).toISOString() : undefined;
      const st = await api.endVoting(iso);
      setStatus(st);
      await refresh();
      flash('Голосование завершено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const onResume = async () => {
    try {
      const st = await api.resumeVoting();
      setStatus(st);
      await refresh();
      flash('Голосование продолжено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const createNominee = async (e: FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', nomineeForm.name);
    form.append('reportName', nomineeForm.reportName);
    if (nomineeForm.image) form.append('image', nomineeForm.image);
    try {
      await api.createNominee(form);
      setNomineeForm({ name: '', reportName: '', image: null });
      await refresh();
      flash('Номинант создан');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const createNomination = async (e: FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('title', nominationForm.title);
    form.append('description', nominationForm.description);
    form.append('nomineeIds', nominationForm.nomineeIds.join(','));
    if (nominationForm.image) form.append('image', nominationForm.image);
    try {
      await api.createNomination(form);
      setNominationForm({ title: '', description: '', image: null, nomineeIds: [] });
      await refresh();
      flash('Номинация создана');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">Race Control</span>
        </div>
        <div className="actions">
          <span style={{ color: 'var(--muted)', alignSelf: 'center' }}>
            {status?.votingOpen ? 'Голосование открыто' : 'Голосование закрыто'}
          </span>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="page">
        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        <div className="admin-grid">
          <nav className="admin-nav panel">
            {(
              [
                ['stats', 'Статистика'],
                ['nominations', 'Номинации'],
                ['nominees', 'Номинанты'],
                ['reports', 'Отчёты'],
                ['account', 'Логин / пароль'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={tab === key ? 'active' : ''}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>

          <section>
            {tab === 'stats' && (
              <div>
                <div className="panel" style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 0 }}>
                    Управление голосованием
                  </h2>
                  <div className="field">
                    <label>Время объявления (для таймера у пользователей)</label>
                    <input
                      type="datetime-local"
                      value={announcementLocal}
                      onChange={(e) => setAnnouncementLocal(e.target.value)}
                    />
                  </div>
                  <div className="actions">
                    {status?.votingOpen ? (
                      <button className="btn btn-primary" type="button" onClick={() => void onEndVoting()}>
                        Завершить голосование
                      </button>
                    ) : (
                      <button className="btn btn-primary" type="button" onClick={() => void onResume()}>
                        Продолжить голосование
                      </button>
                    )}
                  </div>
                </div>

                {stats.map((s) => (
                  <div key={s.nominationId}>
                    <div className="stats-row">
                      <div>
                        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                          {s.title}
                        </strong>
                        <div style={{ color: 'var(--muted)' }}>Голосов: {s.totalVotes}</div>
                      </div>
                      <div className="actions">
                        {s.hasTie && (
                          <>
                            <span className="tie-flag" title="Ничья">
                              !
                            </span>
                            <button
                              className="btn btn-ghost"
                              type="button"
                              onClick={() => setOpenTie(openTie === s.nominationId ? null : s.nominationId)}
                            >
                              Разобрать ничью
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {openTie === s.nominationId && s.hasTie && (
                      <div className="tie-panel">
                        <p style={{ marginTop: 0 }}>Лидируют с одинаковым числом голосов:</p>
                        <div className="actions">
                          {s.leaders.map((l) => (
                            <button
                              key={l.nomineeId}
                              className="btn btn-primary"
                              type="button"
                              onClick={() =>
                                void api
                                  .resolveTie(s.nominationId, l.nomineeId)
                                  .then(() => refresh())
                                  .then(() => flash('Победитель выбран'))
                                  .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
                              }
                            >
                              {l.name} ({l.votes})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!status?.votingOpen && s.breakdown.length > 0 && (
                      <div className="panel" style={{ marginBottom: '1rem' }}>
                        {s.breakdown.map((b) => (
                          <div key={b.nomineeId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{b.name}</span>
                            <span>{b.votes}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'nominees' && (
              <div>
                <form className="panel" onSubmit={(e) => void createNominee(e)} style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 0 }}>
                    Новый номинант
                  </h2>
                  <div className="field">
                    <label>Имя</label>
                    <input
                      value={nomineeForm.name}
                      onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Имя для отчёта (не показывается в UI)</label>
                    <input
                      value={nomineeForm.reportName}
                      onChange={(e) => setNomineeForm({ ...nomineeForm, reportName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Картинка</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNomineeForm({ ...nomineeForm, image: e.target.files?.[0] || null })
                      }
                    />
                  </div>
                  <button className="btn btn-primary" type="submit">
                    Создать
                  </button>
                </form>

                <div className="table-list">
                  {nominees.map((n) => (
                    <div className="table-item" key={n.id}>
                      <AuthImage src={n.imageUrl} alt={n.name} />
                      <div>
                        <strong>{n.name}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          report: {n.reportName}
                        </div>
                      </div>
                      <button
                        className="btn btn-danger"
                        type="button"
                        onClick={() =>
                          void api
                            .deleteNominee(n.id)
                            .then(refresh)
                            .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
                        }
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'nominations' && (
              <div>
                <form className="panel" onSubmit={(e) => void createNomination(e)} style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 0 }}>
                    Новая номинация
                  </h2>
                  <div className="field">
                    <label>Название</label>
                    <input
                      value={nominationForm.title}
                      onChange={(e) => setNominationForm({ ...nominationForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Описание</label>
                    <textarea
                      rows={3}
                      value={nominationForm.description}
                      onChange={(e) =>
                        setNominationForm({ ...nominationForm, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Картинка</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNominationForm({ ...nominationForm, image: e.target.files?.[0] || null })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Номинанты</label>
                    <div className="checkbox-list">
                      {nominees.map((n) => {
                        const checked = nominationForm.nomineeIds.includes(n.id);
                        return (
                          <label key={n.id}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setNominationForm((prev) => ({
                                  ...prev,
                                  nomineeIds: checked
                                    ? prev.nomineeIds.filter((id) => id !== n.id)
                                    : [...prev.nomineeIds, n.id],
                                }));
                              }}
                            />
                            {n.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <button className="btn btn-primary" type="submit">
                    Создать номинацию
                  </button>
                </form>

                <div className="noms-rail">
                  {nominations.map((n) => (
                    <article className="nom-card" key={n.id} style={{ cursor: 'default' }}>
                      <div className="nom-card-body">
                        <div>
                          <h2>{n.title}</h2>
                          <p>{n.description}</p>
                          <p style={{ color: 'var(--silver)' }}>
                            Номинантов: {n.nominees.length}
                          </p>
                        </div>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() =>
                            void api
                              .deleteNomination(n.id)
                              .then(refresh)
                              .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
                          }
                        >
                          Удалить
                        </button>
                      </div>
                      <div className="nom-card-media">
                        <AuthImage src={n.imageUrl} alt={n.title} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {tab === 'reports' && (
              <div className="panel">
                <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 0 }}>
                  PDF-отчёты
                </h2>
                <p className="lead">Доступны после завершения голосования.</p>
                <div className="actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={!!status?.votingOpen}
                    onClick={() =>
                      void api
                        .downloadWinnersReport()
                        .then(() => flash('Скачан winners.pdf'))
                        .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
                    }
                  >
                    Отчёт победителей
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={!!status?.votingOpen}
                    onClick={() =>
                      void api
                        .downloadDetailedReport()
                        .then(() => flash('Скачан votes-detailed.pdf'))
                        .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
                    }
                  >
                    Детальный по голосам
                  </button>
                </div>
              </div>
            )}

            {tab === 'account' && (
              <form
                className="panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (credForm.newPassword !== credForm.confirmPassword) {
                    setError('Новый пароль и подтверждение не совпадают');
                    return;
                  }
                  setCredSaving(true);
                  setError('');
                  void api
                    .changeAdminCredentials(
                      credForm.currentPassword,
                      credForm.newLogin || user?.username || '',
                      credForm.newPassword,
                    )
                    .then((res) => {
                      loginWithToken(res);
                      setCredForm({
                        currentPassword: '',
                        newLogin: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      flash('Логин и пароль обновлены');
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
                    .finally(() => setCredSaving(false));
                }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 0 }}>
                  Смена логина и пароля
                </h2>
                <p className="lead" style={{ marginTop: 0 }}>
                  Текущий логин: <strong>{user?.username}</strong>
                </p>
                <div className="field">
                  <label>Текущий пароль</label>
                  <input
                    type="password"
                    value={credForm.currentPassword}
                    onChange={(e) => setCredForm({ ...credForm, currentPassword: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="field">
                  <label>Новый логин</label>
                  <input
                    value={credForm.newLogin}
                    onChange={(e) => setCredForm({ ...credForm, newLogin: e.target.value })}
                    placeholder={user?.username || 'новый логин'}
                    minLength={3}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="field">
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    value={credForm.newPassword}
                    onChange={(e) => setCredForm({ ...credForm, newPassword: e.target.value })}
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="field">
                  <label>Повторите новый пароль</label>
                  <input
                    type="password"
                    value={credForm.confirmPassword}
                    onChange={(e) => setCredForm({ ...credForm, confirmPassword: e.target.value })}
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={credSaving}>
                  {credSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
