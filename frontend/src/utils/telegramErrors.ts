/** Errors from Telegram Login popup that users should never see. */
const SILENT_ERRORS = [
  'popup_closed',
  'popup_blocked',
  'user_cancelled',
  'cancelled',
  'canceled',
  'closed',
  'access_denied',
];

export function isSilentTelegramError(message: string | null | undefined): boolean {
  if (!message) return true;
  const normalized = message.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return SILENT_ERRORS.some((code) => normalized === code || normalized.includes(code));
}

export function toUserFriendlyAuthError(message: string | null | undefined): string | null {
  if (!message || isSilentTelegramError(message)) return null;

  const lower = message.toLowerCase();
  if (lower.includes('id_token') || lower.includes('invalid telegram')) {
    // Transient / race after closing popup — don't scare the user
    return null;
  }
  if (lower.includes('network') || lower.includes('unreachable')) {
    return 'Сервер временно недоступен. Попробуйте ещё раз.';
  }
  return 'Не удалось войти. Нажмите кнопку ещё раз.';
}
