import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const RTL_LANGUAGES = ['fa'];

function applyDocumentDirection(lang: string) {
  const isRtl = RTL_LANGUAGES.includes(lang);
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.classList.toggle('font-fa', isRtl);
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fa'],
    debug: false,
    backend: {
      // Files live at /public/locales/<lng>/translation.json, copied
      // as-is to the build output root, so this path works both in dev
      // and in production.
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'onward_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      // Translations are small static JSON files with essentially
      // instant load time — synchronous fallback (render the key, then
      // re-render once loaded) avoids needing a Suspense boundary
      // around the whole app for a flicker that's over in milliseconds.
      useSuspense: false,
    },
  });

applyDocumentDirection(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', applyDocumentDirection);

export default i18n;
