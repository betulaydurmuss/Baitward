// Toggles the interface language and persists the choice via the i18n detector.
// Shows the language the click will switch *to*, with a globe icon for recognition.
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage === 'tr' ? 'tr' : 'en';
  const next = current === 'tr' ? 'en' : 'tr';

  return (
    <button
      type="button"
      className="lang-switch"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={t('language')}
      title={t('language')}
    >
      <Globe size={14} aria-hidden="true" />
      {next.toUpperCase()}
    </button>
  );
}
