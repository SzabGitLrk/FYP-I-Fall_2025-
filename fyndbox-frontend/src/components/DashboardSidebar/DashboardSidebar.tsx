import { FC, ReactElement, useEffect, useState } from 'react';
import { Tooltip } from '@mui/material';
import {
  ChevronLeftRounded,
  ChevronRightRounded,
} from '@mui/icons-material';
import FyndBoxLogo from '../../assets/FyndBox.png';
import { useUser } from '../../hooks/useUser';
import {
  BrandLockup,
  DashboardRail,
  RailAvatar,
  RailFooter,
  RailHeader,
  RailNav,
  RailNavGroup,
  RailNavItem,
  RailProfileCard,
  RailProfileStatus,
  RailProfileText,
  RailToggleButton,
} from '../../pages/DashboardPage/DashboardPage.styles';

export interface DashboardSidebarItem {
  label: string;
  icon: ReactElement;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardSidebarProps {
  items: DashboardSidebarItem[];
  logoutItem: DashboardSidebarItem;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const isUsableImageSource = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  return (
    /^(https?:|data:image\/|blob:|\/)/i.test(value) ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(value)
  );
};

const DashboardSidebar: FC<DashboardSidebarProps> = ({
  items,
  logoutItem,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { data: user } = useUser();
  const mainItems = items.slice(0, 4);
  const preferenceItems = items.slice(4);
  const profileName = user?.name || 'FyndBox User';
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('');
  const profileImage = user?.image?.trim();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const hasProfileImage = isUsableImageSource(profileImage) && !avatarFailed;

  useEffect(() => {
    setAvatarFailed(false);
  }, [profileImage]);

  const renderNavItem = (item: DashboardSidebarItem, danger = false) => {
    const navItem = (
      <RailNavItem
        key={item.label}
        $active={item.active}
        $collapsed={isCollapsed}
        $danger={danger}
        onClick={item.onClick}
      >
        {item.icon}
        <span>{item.label}</span>
      </RailNavItem>
    );

    if (!isCollapsed) {
      return navItem;
    }

    return (
      <Tooltip key={item.label} title={item.label} placement="right">
        {navItem}
      </Tooltip>
    );
  };

  return (
    <DashboardRail $collapsed={isCollapsed}>
      <RailHeader $collapsed={isCollapsed}>
        <BrandLockup $collapsed={isCollapsed}>
          <img src={FyndBoxLogo} alt="FyndBox" />
          <span>FyndBox</span>
        </BrandLockup>
        <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <RailToggleButton
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            role="button"
            tabIndex={0}
            onClick={onToggleCollapse}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleCollapse();
              }
            }}
          >
            {isCollapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
          </RailToggleButton>
        </Tooltip>
      </RailHeader>

      <RailProfileCard $collapsed={isCollapsed}>
        <RailAvatar $collapsed={isCollapsed}>
          {hasProfileImage ? (
            <img
              src={profileImage}
              alt=""
              aria-hidden="true"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span>{initials || 'F'}</span>
          )}
          <RailProfileStatus />
        </RailAvatar>
        <RailProfileText $collapsed={isCollapsed}>
          <strong>{profileName}</strong>
        </RailProfileText>
      </RailProfileCard>

      <RailNav>
        <RailNavGroup>{mainItems.map((item) => renderNavItem(item))}</RailNavGroup>
        {preferenceItems.length > 0 && (
          <RailNavGroup>
            {preferenceItems.map((item) => renderNavItem(item))}
          </RailNavGroup>
        )}
      </RailNav>

      <RailFooter $collapsed={isCollapsed}>
        {renderNavItem(logoutItem, true)}
      </RailFooter>
    </DashboardRail>
  );
};

export default DashboardSidebar;



