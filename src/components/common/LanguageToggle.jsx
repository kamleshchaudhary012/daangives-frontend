import React, { useState } from 'react';

export default function LanguageToggle() {
  const [lang, setLang] = useState('en');

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'gu' : 'en';
    setLang(nextLang);
    // Dispatches custom event for components listening to language changes
    window.dispatchEvent(new CustomEvent('daangives_lang_change', { detail: nextLang }));
  };

  return (
    <button
      onClick={toggleLanguage}
      title="Toggle English / Gujarati"
    >
    </button>
  );
}
