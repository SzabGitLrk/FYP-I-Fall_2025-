import { FC, useState } from 'react';
import { IconButton, Typography } from '@mui/material';
import {
  AccountCircle,
  Info,
  ArrowBack,
  ChevronRight,
  Security,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import {
  AvatarContainer,
  DeactivateButton,
  HeaderSpacer,
  HeaderTitle,
  IconButtonContainer,
  LinkButton,
  LinkElement,
  LogoutButton,
  MenuIconWrapper,
  ProfileBlock,
  ProfileEmail,
  ProfileName,
  SidebarContainer,
  SidebarDrawer,
  SidebarElementContainer,
  SidebarHeader,
} from './Sidebar.styles';
import { ButtonsGroupWrapper } from '../../styles/commonStyles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useDeactivateUser, useUser } from '../../hooks/useUser';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';

const Sidebar: FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const { logout } = useAuth();
  const { data: user } = useUser();
  const { mutateAsync: deactivateUser } = useDeactivateUser();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleCloseDeactivateDialog = () => {
    setDeactivateDialogOpen(false);
  };

  const handleDeactivate = async () => {
    try {
      await deactivateUser();
      logout();
      setDeactivateDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleOpenDeactivateDialog = () => {
    setDeactivateDialogOpen(true);
  };

  const handleNavigation = (section: string) => {
    navigate(`/settings?section=${section}`);
    onClose();
  };



  const iconMap: { [key: string]: JSX.Element } = {
    account_circle: <AccountCircle />,
    security: <Security />,
    info: <Info />,
  };

  const menuItems = t('sidebar.menuItems', { returnObjects: true }) as Array<{
    text: string;
    icon: string;
    section: string;
  }>;

  const profileName = user?.name || 'Fayaz Hussain';
  const profileEmail = user?.email || 'fayazhussain.cs@gmail.com';
  const profileImage = user?.image || null;
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('');

  return (
    <>
      <SidebarDrawer anchor="right" open={open} onClose={onClose}>
        {/* ── Header ─────────────────────────────────── */}
        <SidebarHeader>
          <IconButton onClick={onClose} aria-label={t('common.back')}>
            <ArrowBack />
          </IconButton>
          <HeaderTitle variant="h6">Settings</HeaderTitle>
          <HeaderSpacer />
        </SidebarHeader>

        {/* ── Body ───────────────────────────────────── */}
        <SidebarContainer>
          <ProfileBlock>
            <AvatarContainer src={profileImage || ''} alt={profileName}>
              {!profileImage && (initials || 'F')}
            </AvatarContainer>
            <ProfileName variant="h6">{profileName}</ProfileName>
            <ProfileEmail variant="body2">{profileEmail}</ProfileEmail>
          </ProfileBlock>

          <SidebarElementContainer>
            {menuItems.map((item, index) => (
              <LinkElement key={index}>
                <LinkButton
                  fullWidth
                  onClick={() => handleNavigation(item.section)}
                >
                  <IconButtonContainer>
                    <MenuIconWrapper>
                      {iconMap[item.icon]}
                    </MenuIconWrapper>
                    <Typography variant="body1" ml={1.5} fontWeight={600} fontSize="1.05rem">
                      {item.text}
                    </Typography>
                  </IconButtonContainer>
                  <ChevronRight />
                </LinkButton>
              </LinkElement>
            ))}
          </SidebarElementContainer>

          <ButtonsGroupWrapper>
            <DeactivateButton
              variant="contained"
              onClick={handleOpenDeactivateDialog}
            >
              {t('sidebar.deactivate')}
            </DeactivateButton>
            <LogoutButton variant="outlined" onClick={handleLogout} fullWidth>
              {t('sidebar.logout')}
            </LogoutButton>
          </ButtonsGroupWrapper>

          <LanguageSelector />
        </SidebarContainer>
      </SidebarDrawer>

      <ConfirmationDialog
        isOpen={isDeactivateDialogOpen}
        titleKey="modal.deactivateTitle"
        messageKey="modal.deactivateConfirmation"
        confirmButtonTextKey="modal.deactivate"
        onConfirm={handleDeactivate}
        onCancel={handleCloseDeactivateDialog}
      />
    </>
  );
};

export default Sidebar;

