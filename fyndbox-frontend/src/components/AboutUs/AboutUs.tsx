import { Link } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Inventory2Rounded,
  LocationOnRounded,
  QrCode2Rounded,
  WidgetsRounded,
} from '@mui/icons-material';
import {
  AboutContact,
  AboutContent,
  AboutFeatureCard,
  AboutFeatureGrid,
  AboutFeatureIcon,
  AboutIntro,
  AboutSummary,
} from './AboutUs.styles';

const AboutUs: FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      titleKey: 'settings.about.addUnitTitle',
      textKey: 'settings.about.addUnitText',
      icon: <LocationOnRounded />,
    },
    {
      titleKey: 'settings.about.createBoxTitle',
      textKey: 'settings.about.createBoxText',
      icon: <Inventory2Rounded />,
    },
    {
      titleKey: 'settings.about.addItemTitle',
      textKey: 'settings.about.addItemText',
      icon: <WidgetsRounded />,
    },
    {
      titleKey: 'settings.about.printQRcodeTitle',
      textKey: 'settings.about.printQRcodeText',
      icon: <QrCode2Rounded />,
    },
  ];

  const contactUsText = t('settings.about.contactUsText');

  const [beforeEmail, afterEmail] = contactUsText.split('{email}');

  return (
    <AboutContent>
      <AboutIntro variant="body1">
        {t('settings.about.welcomeText')}
      </AboutIntro>

      <AboutFeatureGrid>
        {sections.map((section) => (
          <AboutFeatureCard key={section.titleKey}>
            <AboutFeatureIcon>{section.icon}</AboutFeatureIcon>
            <div>
              <h3>{t(section.titleKey)}</h3>
              <p>{t(section.textKey)}</p>
            </div>
          </AboutFeatureCard>
        ))}
      </AboutFeatureGrid>

      <AboutSummary variant="body2">
        {t('settings.about.withFyndboxText')}
      </AboutSummary>

      <AboutContact variant="body2">
        {beforeEmail}
        <Link
          href={`mailto:${t('settings.about.email')}`}
          underline="always"
          color="info"
        >
          {t('settings.about.email')}
        </Link>
        {afterEmail}
      </AboutContact>
    </AboutContent>
  );
};

export default AboutUs;
