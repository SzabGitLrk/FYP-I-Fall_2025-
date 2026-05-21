import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AuthButtonsGroup from '../../components/AuthButtonsGroup/AuthButtonsGroup';
import {
  CardMeta,
  LandingActions,
  LandingCardBody,
} from './LandingPage.styles';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import appLogo from '../../assets/FyndBox.png';
import { CustomLink } from '../../styles/commonStyles';
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

const LandingPage: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const contactUsText = t('settings.about.contactUsText');
  const [beforeEmail, afterEmail] = contactUsText.split('{email}');

  return (
    <LoginPageShell>
      <DecorativeLayer />
      <SoftCircle placement="top" />
      <SoftCircle placement="left" />
      <SoftCircle placement="right" />

      <LoginContent>
        <BrandBlock>
          <img src={appLogo} alt="FyndBox" />
          <span>FyndBox</span>
        </BrandBlock>

        <LoginCard>
          <LandingCardBody>
            <LoginTitle variant="h1">{t('home.title')}</LoginTitle>
            <Typography variant="body1" className="desktop-copy">
              {t('home.description')}
            </Typography>
            <Typography variant="body1" className="mobile-copy">
              An efficient solution to gain complete control over your
              inventory. Organize and manage items by adding boxes and
              specifying details.
            </Typography>
            <LandingActions>
              <AuthButtonsGroup
                onLoginClick={handleLoginClick}
                onRegisterClick={handleSignupClick}
              />
            </LandingActions>
            <CardMeta>
              <CustomLink href="/user-guide" underline="always">
                {t('home.guideLink')}
              </CustomLink>
              <Typography variant="body2">
                {beforeEmail}
                <Link
                  href={`mailto:${t('settings.about.email')}`}
                  underline="always"
                  color="inherit"
                >
                  {t('settings.about.email')}
                </Link>
                {afterEmail}
              </Typography>
            </CardMeta>
          </LandingCardBody>
        </LoginCard>

        <LanguageWrap>
          <LanguageSelector compact />
        </LanguageWrap>
      </LoginContent>
    </LoginPageShell>
  );
};

export default LandingPage;
