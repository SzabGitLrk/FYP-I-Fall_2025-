import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobileStepper, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import SliderCard from '../../components/SliderCard/SliderCard';
import { guideSteps } from '../../data/guideSteps';
import {
  UserGuidePageShell,
  DecorativeLayer,
  SoftCircle,
  UserGuideContent,
  GoBackButton,
  GoBackIcon,
  StyledArrowBack,
  UserGuideTitle,
  UserGuideDescription,
  GuideCard,
  StepperWrapper,
  BecomeMemberButton,
  LanguageWrap,
} from './UserGuide.styles';

const UserGuidePage: FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const { t } = useTranslation();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <UserGuidePageShell>
      <DecorativeLayer />
      <SoftCircle placement="top" />
      <SoftCircle placement="left" />
      <SoftCircle placement="right" />

      <UserGuideContent>
        <UserGuideTitle variant="h2">{t('userGuide.title')}</UserGuideTitle>
        <UserGuideDescription variant="body1">
          {t('userGuide.description')}
        </UserGuideDescription>

        <GuideCard>
          <GoBackButton onClick={handleBackClick}>
            <GoBackIcon className="go-back-icon">
              <StyledArrowBack />
            </GoBackIcon>
            {t('common.back')}
          </GoBackButton>
          
          <SliderCard
            title={t(guideSteps[activeStep].title)}
            description={t(guideSteps[activeStep].description)}
            step={guideSteps[activeStep].step}
          />
          <StepperWrapper>
            <MobileStepper
              variant="dots"
              steps={guideSteps.length}
              position="static"
              activeStep={activeStep}
              nextButton={
                <Button
                  size="small"
                  onClick={handleNext}
                  disabled={activeStep === guideSteps.length - 1}
                >
                  {t('userGuide.guideSteps.next')}
                  <KeyboardArrowRight />
                </Button>
              }
              backButton={
                <Button
                  size="small"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  <KeyboardArrowLeft />
                  {t('userGuide.guideSteps.back')}
                </Button>
              }
            />
          </StepperWrapper>
          <BecomeMemberButton as="button" onClick={handleSignupClick}>
            {t('signup.submit')}
          </BecomeMemberButton>
        </GuideCard>

        <LanguageWrap>
          <LanguageSelector compact />
        </LanguageWrap>
      </UserGuideContent>
    </UserGuidePageShell>
  );
};

export default UserGuidePage;
