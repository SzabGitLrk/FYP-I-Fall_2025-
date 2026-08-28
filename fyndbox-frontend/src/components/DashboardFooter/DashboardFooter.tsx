import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FooterContainer,
  FooterItem,
  FooterFabButton,
  FooterItemLabel,
  FooterFabSpacer,
} from './DashboardFooter.styles';
import {
  Settings,
  Favorite,
  QrCodeScanner,
  AutoAwesomeMosaicRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';

interface DashboardFooterProps {
  onFavoriteClick: () => void;
  onScanClick: () => void;
  onSettingsClick: () => void;
  onTemplateClick?: () => void;
  onSmartAddClick?: () => void;
}

const DashboardFooter: FC<DashboardFooterProps> = ({
  onFavoriteClick,
  onScanClick,
  onSettingsClick,
  onTemplateClick,
  onSmartAddClick,
}) => {
  const { t } = useTranslation();

  return (
    <FooterContainer>
      {/* Item 1: Favorites */}
      <FooterItem onClick={onFavoriteClick}>
        <Favorite />
        <FooterItemLabel>{t('dashboard.footer.favorite', { defaultValue: 'Favorites' })}</FooterItemLabel>
      </FooterItem>

      {/* Item 2: Scan */}
      <FooterItem onClick={onScanClick}>
        <QrCodeScanner />
        <FooterItemLabel>{t('dashboard.footer.scan', { defaultValue: 'Scan' })}</FooterItemLabel>
      </FooterItem>

      {/* Spacer before FAB - creates breathing room */}
      <FooterFabSpacer />

      {/* Spacer after FAB - creates breathing room */}
      <FooterFabSpacer />

      {/* Item 3: Template */}
      {onTemplateClick && (
        <FooterItem onClick={onTemplateClick}>
          <AutoAwesomeMosaicRounded />
          <FooterItemLabel>{t('dashboard.footer.template', { defaultValue: 'Template' })}</FooterItemLabel>
        </FooterItem>
      )}

      {/* Item 4: Settings */}
      <FooterItem onClick={onSettingsClick}>
        <Settings />
        <FooterItemLabel>{t('dashboard.footer.settings', { defaultValue: 'Settings' })}</FooterItemLabel>
      </FooterItem>

      {/* FAB - Smart Add (centered and elevated above nav bar) */}
      <FooterFabButton aria-label="Smart Add" onClick={onSmartAddClick}>
        <AutoAwesomeRounded />
      </FooterFabButton>
    </FooterContainer>
  );
};

export default DashboardFooter;
