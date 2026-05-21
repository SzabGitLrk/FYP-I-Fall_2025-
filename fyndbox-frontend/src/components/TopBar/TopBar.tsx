import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppBarContainer,
  HeaderDotPattern,
  MobileBrandLockup,
  MobileHeaderStack,
  NotificationSlot,
  HeaderSubtitle,
  ToolbarContainer,
} from './TopBar.styles';
import PageHeader from '../PageHeader/PageHeader';
import CustomNotifications from '../Notifications/CustomNotifications';
import FyndBoxLogo from '../../assets/FyndBox.png';

const TopBar: FC = () => {
  const { t } = useTranslation();
  return (
    <AppBarContainer position="static">
      <HeaderDotPattern />
      <ToolbarContainer>
        <MobileHeaderStack>
          <MobileBrandLockup>
            <img src={FyndBoxLogo} alt="FyndBox" />
            <span>FyndBox</span>
          </MobileBrandLockup>
          <PageHeader heading={t('dashboard.title')} />
          <HeaderSubtitle>
            {t('dashboard.subtitle', {
              defaultValue: 'Manage your storage locations',
            })}
          </HeaderSubtitle>
        </MobileHeaderStack>
        <NotificationSlot>
          <CustomNotifications />
        </NotificationSlot>
      </ToolbarContainer>
    </AppBarContainer>
  );
};

export default TopBar;
