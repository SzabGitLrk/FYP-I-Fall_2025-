import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FooterActionButton, FooterContainer } from './DashboardFooter.styles';
import {
  Settings,
  Favorite,
  QrCodeScanner,
  MenuBookRounded,
} from '@mui/icons-material';

interface DashboardFooterProps {
  onFavoriteClick: () => void;
  onScanClick: () => void;
  onSettingsClick: () => void;
  onTemplateClick?: () => void;
}

const DashboardFooter: FC<DashboardFooterProps> = ({
  onFavoriteClick,
  onScanClick,
  onSettingsClick,
  onTemplateClick,
}) => {
  const { t } = useTranslation();
  return (
    <FooterContainer showLabels>
      <FooterActionButton
        label={t('dashboard.footer.favorite')}
        icon={<Favorite />}
        onClick={onFavoriteClick}
      />
      <FooterActionButton
        label={t('dashboard.footer.scan')}
        icon={<QrCodeScanner />}
        onClick={onScanClick}
      />
      {onTemplateClick && (
        <FooterActionButton
          label={t('templatesSidebar.title', {
            defaultValue: 'Template Library',
          })}
          icon={<MenuBookRounded />}
          onClick={onTemplateClick}
        />
      )}
      <FooterActionButton
        label={t('dashboard.footer.settings')}
        icon={<Settings />}
        onClick={onSettingsClick}
      />
    </FooterContainer>
  );
};

export default DashboardFooter;
