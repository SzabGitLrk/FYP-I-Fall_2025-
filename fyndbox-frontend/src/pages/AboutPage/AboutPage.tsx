import { FC } from 'react';
import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AboutUs from '../../components/AboutUs/AboutUs';
import {
  AboutCard,
  AboutPageContainer,
  AboutPageShell,
  GoBackButton,
  StyledArrowBack,
} from './AboutPage.styles';

const AboutPage: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AboutPageContainer>
      <AboutPageShell>
        <AboutCard>
          <GoBackButton onClick={() => navigate('/')}>
            <StyledArrowBack />
          </GoBackButton>
          <Typography variant="h1">
            {t('settings.about.title', { defaultValue: 'About Fyndbox' })}
          </Typography>
          <AboutUs />
        </AboutCard>
      </AboutPageShell>
    </AboutPageContainer>
  );
};

export default AboutPage;
