// Switches between the dark and light themes by setting <html data-theme> and
// persisting the choice. The initial value is applied in index.html before paint
// (so there is no flash); here we just keep React state in sync with it.
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Theme = 'dark' | 'light';

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('baitward-theme', theme);
    } catch {
      // Private mode or blocked storage — the attribute still applies for this view.
    }
  }, [theme]);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      className="lang-switch"
      onClick={() => setTheme(next)}
      aria-label={t('theme')}
      title={t('theme')}
    >
      <Icon size={14} aria-hidden="true" />
      {next === 'light' ? t('themeLight') : t('themeDark')}
    </button>
  );
}
