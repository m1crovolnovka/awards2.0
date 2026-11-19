import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ErrorKind } from '../types';

const COPY: Record<
  ErrorKind,
  { code: string; title: string; text: string; cta: string; to?: string }
> = {
  '404': {
    code: '404',
    title: 'OFF TRACK',
    text: 'Эта страница вылетела с трассы. Похоже, такого маршрута нет.',
    cta: 'На старт',
    to: '/',
  },
  '403': {
    code: '403',
    title: 'PIT LANE CLOSED',
    text: 'У вас нет доступа в эту зону боксов. Race Control не пускает.',
    cta: 'Назад',
  },
  offline: {
    code: 'NO SIGNAL',
    title: 'RADIO SILENCE',
    text: 'Бэкенд не отвечает. Проверьте соединение или подождите, пока сервер прогреется (cold start на Render).',
    cta: 'Повторить',
  },
  '500': {
    code: '500',
    title: 'ENGINE FAILURE',
    text: 'На сервере что-то пошло не так. Попробуйте ещё раз чуть позже.',
    cta: 'На главную',
    to: '/',
  },
};

export function ErrorPage({
  kind,
  onRetry,
}: {
  kind: ErrorKind;
  onRetry?: () => void;
}) {
  const navigate = useNavigate();
  const c = COPY[kind];

  const action = () => {
    if (kind === 'offline' && onRetry) {
      onRetry();
      return;
    }
    if (kind === '403') {
      navigate(-1);
      return;
    }
    if (c.to) navigate(c.to);
  };

  return (
    <div className="error-stage">
      <div className="error-track" aria-hidden>
        {[...Array(12)].map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.08}s`, top: `${6 + i * 8}%` }} />
        ))}
      </div>
      <div className="error-chequer" aria-hidden />

      <motion.div
        className="error-card"
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <motion.div
          className="error-code"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 160 }}
        >
          {c.code}
        </motion.div>
        <motion.h1
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {c.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {c.text}
        </motion.p>

        <div className="error-car-wrap" aria-hidden>
          <div className="error-car" />
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={action}>
            {c.cta}
          </button>
          <Link className="btn btn-ghost" to="/">
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function NotFoundPage() {
  return <ErrorPage kind="404" />;
}

export function ForbiddenPage() {
  return <ErrorPage kind="403" />;
}

export function OfflinePage({ onRetry }: { onRetry: () => void }) {
  return <ErrorPage kind="offline" onRetry={onRetry} />;
}

export function ServerErrorPage() {
  return <ErrorPage kind="500" />;
}
