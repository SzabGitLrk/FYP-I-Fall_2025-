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
  SearchContainer,
  HeaderContentWrapper,
} from './TopBar.styles';
import PageHeader from '../PageHeader/PageHeader';
import CustomNotifications from '../Notifications/CustomNotifications';
import SearchField from '../SearchField/SearchField';
import FyndBoxLogo from '../../assets/FyndBox.png';

interface TopBarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const TopBar: FC<TopBarProps> = ({ onSearch, searchValue, onSearchChange }) => {
  const { t } = useTranslation();
  return (
    <AppBarContainer position="static">
      <HeaderDotPattern />
      <ToolbarContainer>
        <HeaderContentWrapper>
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
          
          {/* Search Bar - Inside Header */}
          {onSearch && (
            <SearchContainer>
              <SearchField 
                onSearch={onSearch} 
                value={searchValue} 
                onChange={onSearchChange}
              />
            </SearchContainer>
          )}
        </HeaderContentWrapper>
        
        <NotificationSlot>
          <CustomNotifications />
        </NotificationSlot>
      </ToolbarContainer>
    </AppBarContainer>
  );
};

export default TopBar;
