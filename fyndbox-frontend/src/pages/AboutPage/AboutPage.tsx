import { FC } from 'react';
import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AboutUs from '../../components/AboutUs/AboutUs';
import {
  AboutCard,
  AboutPageContainer,
  AboutPageShell,
} from './AboutPage.styles';
import { GoBackButton, StyledArrowBack } from '../../styles/commonStyles';

const AboutPage: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AboutPageContainer>
      <AboutPageShell>
        <GoBackButton onClick={() => navigate('/')}>
          <StyledArrowBack />
          <Typography variant="h6" component="span" pl={1}>
            {t('common.back')}
          </Typography>
        </GoBackButton>
        <AboutCard>
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
