import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link, Typography } from '@mui/material';
import {
  AddBoxRounded,
  ImageRounded,
  Inventory2Rounded,
  NumbersRounded,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AuthButtonsGroup from '../../components/AuthButtonsGroup/AuthButtonsGroup';
import {
  BoxesIllustration,
  CardMeta,
  Eyebrow,
  FeatureIcon,
  FeatureList,
  FeaturePill,
  HeroContent,
  HeroDescription,
  HeroSection,
  HeroTitle,
  HomeContainer,
  IllustrationPanel,
  LoginCard,
  LoginCardBrand,
  LoginCardLogo,
  LoginColumn,
  MobileHeroBrand,
  PageShell,
} from './LandingPage.styles';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import appLogo from '../../assets/FyndBox.png';
import { CustomLink } from '../../styles/commonStyles';

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

  const features = [
    { label: 'Add boxes & items', icon: <AddBoxRounded fontSize="small" /> },
    { label: 'Track quantities', icon: <NumbersRounded fontSize="small" /> },
    { label: 'Upload images', icon: <ImageRounded fontSize="small" /> },
  ];

  return (
    <HomeContainer>
      <PageShell>
        <HeroSection>
          <MobileHeroBrand>
            <img src={appLogo} alt="FyndBox" />
            <span>FyndBox</span>
          </MobileHeroBrand>
          <HeroContent>
            <Eyebrow>
              <Inventory2Rounded fontSize="small" />
              Smart storage control
            </Eyebrow>
            <HeroTitle variant="h1">Smart Inventory. Simplified.</HeroTitle>
            <HeroDescription variant="body1">
              Organize your storages, boxes, and items in one clean workspace.
              FyndBox helps you track quantities, add photos, and find what you
              need faster.
            </HeroDescription>
            <FeatureList>
              {features.map((feature) => (
                <FeaturePill key={feature.label}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <Typography variant="body2">{feature.label}</Typography>
                </FeaturePill>
              ))}
            </FeatureList>
            <IllustrationPanel data-mobile-visual="true">
              <BoxesIllustration
                viewBox="0 0 520 300"
                role="img"
                aria-label="Inventory boxes illustration"
              >
                <path
                  d="M74 110v74l68 38 68-38v-74l-68-38-68 38Z"
                  fill="none"
                  stroke="#3E765A"
                  strokeWidth="3"
                  opacity="0.28"
                />
                <path
                  d="M318 66v102l80 46 80-46V66l-80-46-80 46Z"
                  fill="none"
                  stroke="#3E765A"
                  strokeWidth="3"
                  opacity="0.24"
                />
                <path
                  d="M196 128 260 164v104l-64-36V128Z"
                  fill="var(--box-primary-front)"
                  stroke="var(--box-stroke)"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <path
                  d="m260 164 64-36v104l-64 36V164Z"
                  fill="var(--box-primary-side)"
                  stroke="var(--box-stroke)"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <path
                  d="m196 128 64-36 64 36-64 36-64-36Z"
                  fill="var(--box-primary-top)"
                  stroke="var(--box-stroke)"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <path
                  d="m286 54 50 28v88l-50-28V54Z"
                  fill="var(--box-secondary-front)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m336 82 52-30v88l-52 30V82Z"
                  fill="var(--box-secondary-side)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m286 54 50-28 52 26-52 30-50-28Z"
                  fill="var(--box-secondary-top)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m74 188 52 30v76l-52-30v-76Z"
                  fill="var(--box-secondary-front)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m126 218 52-30v76l-52 30v-76Z"
                  fill="var(--box-secondary-side)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m74 188 52-30 52 30-52 30-52-30Z"
                  fill="var(--box-secondary-top)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m376 184 54 31v78l-54-31v-78Z"
                  fill="var(--box-secondary-front)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m430 215 54-31v78l-54 31v-78Z"
                  fill="var(--box-secondary-side)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="m376 184 54-31 54 31-54 31-54-31Z"
                  fill="var(--box-secondary-top)"
                  stroke="var(--box-stroke)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="M126 52h28v28h-28zM40 145h19v19H40zM362 20h20v20h-20zM440 119h19v19h-19z"
                  fill="none"
                  stroke="#3E765A"
                  strokeWidth="4"
                  opacity="0.35"
                />
                <path
                  d="M194 44v16M186 52h16M404 60v16M396 68h16M42 238v16M34 246h16"
                  stroke="#3E765A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.34"
                />
              </BoxesIllustration>
            </IllustrationPanel>
          </HeroContent>

          <LoginColumn>
            <LoginCard>
              <LoginCardBrand>
                <LoginCardLogo src={appLogo} alt="FyndBox" />
              </LoginCardBrand>
              <Typography variant="h1">{t('home.title')}</Typography>
              <Typography variant="body1" className="desktop-copy">
                {t('home.description')}
              </Typography>
              <Typography variant="body1" className="mobile-copy">
                An efficient solution to gain complete control over your
                inventory. Organize and manage items by adding boxes and
                specifying details.
              </Typography>
              <AuthButtonsGroup
                onLoginClick={handleLoginClick}
                onRegisterClick={handleSignupClick}
              />
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
                <LanguageSelector compact />
              </CardMeta>
            </LoginCard>
          </LoginColumn>
        </HeroSection>

      </PageShell>
    </HomeContainer>
  );
};

export default LandingPage;
