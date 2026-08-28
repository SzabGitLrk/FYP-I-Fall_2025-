import { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AccountSettings from '../../components/AccountSettings/AccountSettings';
import SecuritySettings from '../../components/SecuritySettings/SecuritySettings';
import AboutUs from '../../components/AboutUs/AboutUs';
import { StyledArrowBack } from '../../styles/commonStyles';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import appLogo from '../../assets/FyndBox.png';
import {
  BrandBlock,
  DecorativeLayer,
  LanguageWrap,
  LoginCard,
  LoginContent,
  LoginPageShell,
  LoginTitle,
  SoftCircle,
} from '../LoginPage/LoginPage.styles';
import {
  SettingsBackButton,
  SettingsCardFrame,
  SettingsCardContent,
} from './SettingsPage.styles';

interface SettingsSubPageProps {
  section: string;
}

const SettingsSubPage: FC<SettingsSubPageProps> = ({ section }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAboutSection = section === 'about';

  const handleBackClick = () => {
    navigate('/settings');
  };

  const getHeading = () => {
    return t(`settings.${section}.title`, 'No Settings Found');
  };

  const renderContent = () => {
    switch (section) {
      case 'account':
        return <AccountSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'about':
        return <AboutUs />;
      default:
        return (
          <Typography variant="h5">
            {t('common.invalidSection', { defaultValue: 'Invalid section' })}
          </Typography>
        );
    }
  };

  return (
    <LoginPageShell>
      <DecorativeLayer />
      <SoftCircle placement="top" />
      <SoftCircle placement="left" />
      <SoftCircle placement="right" />

      <LoginContent
        sx={isAboutSection ? { maxWidth: 1240, gap: 2.2 } : undefined}
      >
        <BrandBlock>
          <img src={appLogo} alt="FyndBox" />
          <span>FyndBox</span>
        </BrandBlock>

        <SettingsCardFrame wide={isAboutSection}>
          <LoginCard
            sx={
              isAboutSection
                ? {
                    maxWidth: 1240,
                    padding: { xs: 2.4, md: '32px 42px 28px' },
                  }
                : undefined
            }
          >
            <SettingsCardContent
              sx={
                isAboutSection
                  ? { minHeight: 'auto', alignContent: 'start', gap: 1.1 }
                  : undefined
              }
            >
              <SettingsBackButton
                className="settings-back-button"
                onClick={handleBackClick}
              >
                <StyledArrowBack />
                <span>{t('common.back')}</span>
              </SettingsBackButton>
              <LoginTitle variant="h1">{getHeading()}</LoginTitle>
              <Box className="settings-content">{renderContent()}</Box>
            </SettingsCardContent>
          </LoginCard>
        </SettingsCardFrame>

        <LanguageWrap>
          <LanguageSelector compact />
        </LanguageWrap>
      </LoginContent>
    </LoginPageShell>
  );
};

export default SettingsSubPage;
