import { FC } from 'react';
import { Typography } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import swedishFlag from '../../assets/flags/sweden.png';
import ukFlag from '../../assets/flags/uk.png';
import {
  Divider,
  FlagIcon,
  LanguageOption,
  LanguageSelectorWrapper,
} from './LanguageSelector.styles';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  compact?: boolean;
}

const LanguageSelector: FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, switchLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = (newLanguage: string) => {
    switchLanguage(newLanguage);
  };

  return (
    <LanguageSelectorWrapper compact={compact}>
      <FlagIcon
        src={language === 'sv' ? swedishFlag : ukFlag}
        alt={language === 'sv' ? 'Swedish' : 'English'}
      />
      <Typography variant="body1">
        {language === 'sv' ? 'Sweden' : 'English'}
      </Typography>
      <Divider>|</Divider>
      <LanguageOption
        variant="body1"
        onClick={() => handleLanguageChange('sv')}
        isActive={language === 'sv'}
      >
        {t('common.language.option1')}
      </LanguageOption>

      <LanguageOption
        variant="body1"
        onClick={() => handleLanguageChange('en')}
        isActive={language === 'en'}
      >
        {t('common.language.option2')}
      </LanguageOption>
    </LanguageSelectorWrapper>
  );
};

export default LanguageSelector;
