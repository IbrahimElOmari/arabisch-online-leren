import React from 'react';
import { useTranslation } from 'react-i18next';

export const SkipLinks: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        {t('accessibility.skipToMain')}
      </a>
      <a href="#navigation" className="skip-link">
        {t('accessibility.skipToNav')}
      </a>
      <a href="#search" className="skip-link">
        {t('accessibility.skipToSearch')}
      </a>
    </div>
  );
};
