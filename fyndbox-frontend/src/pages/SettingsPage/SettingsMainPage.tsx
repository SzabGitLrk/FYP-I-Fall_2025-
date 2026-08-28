import { FC, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowBack, ChevronRight } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useDeactivateUser, useUser } from '../../hooks/useUser';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import ConfirmationDialog from '../../components/ConfirmationDialog/ConfirmationDialog';
import {
  SettingsMainContainer,
  DecorativeLayer,
  SoftCircle,
  SettingsContent,
  SettingsCard,
  ProfileSection,
  ProfileAvatar,
  ProfileInfo,
  ProfileName,
  ProfileEmail,
  MenuSection,
  MenuCard,
  MenuCardButton,
  MenuCardContent,
  MenuCardLabel,
  DividerLine,
  DangerZoneSection,
  ActionButtonsContainer,
  LanguageContainer,
  BackButtonStyle,
} from './SettingsMainPage.styles';

const SettingsMainPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: user } = useUser();
  const { mutateAsync: deactivateUser } = useDeactivateUser();
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenDeactivateDialog = () => {
    setDeactivateDialogOpen(true);
  };

  const handleCloseDeactivateDialog = () => {
    setDeactivateDialogOpen(false);
  };

  const handleDeactivate = async () => {
    try {
      await deactivateUser();
      logout();
      setDeactivateDialogOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleNavigateToSection = (section: string) => {
    navigate(`/settings?section=${section}`);
  };

  const profileName = user?.name || 'User';
  const profileEmail = user?.email || '';
  const profileImage = user?.image || null;
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('');

  const menuItems = [
    {
      label: t('sidebar.menuItems.0.text', { defaultValue: 'Account Settings' }),
      section: 'account',
    },
    {
      label: t('sidebar.menuItems.1.text', { defaultValue: 'Security Settings' }),
      section: 'security',
    },
    {
      label: t('sidebar.menuItems.2.text', { defaultValue: 'About the Company' }),
      section: 'about',
    },
  ];

  return (
    <SettingsMainContainer>
      <DecorativeLayer />
      <SoftCircle placement="top" />
      <SoftCircle placement="left" />
      <SoftCircle placement="right" />

      {/* Content */}
      <SettingsContent>
        <SettingsCard>
          {/* Back Button */}
          <BackButtonStyle onClick={handleBack}>
            <ArrowBack />
          </BackButtonStyle>

          {/* Profile Section */}
          <ProfileSection>
            <ProfileAvatar src={profileImage || ''} alt={profileName}>
              {!profileImage && (initials || 'F')}
            </ProfileAvatar>
            <ProfileInfo>
              <ProfileName>{profileName}</ProfileName>
              <ProfileEmail>{profileEmail}</ProfileEmail>
            </ProfileInfo>
          </ProfileSection>

          {/* Menu Items */}
          <MenuSection>
            {menuItems.map((item, index) => (
              <MenuCard key={index}>
                <MenuCardButton onClick={() => handleNavigateToSection(item.section)}>
                  <MenuCardContent>
                    <MenuCardLabel>{item.label}</MenuCardLabel>
                  </MenuCardContent>
                  <ChevronRight sx={{ color: 'primary.main' }} />
                </MenuCardButton>
              </MenuCard>
            ))}
          </MenuSection>

          {/* Divider */}
          <DividerLine />

          {/* Danger Zone */}
          <DangerZoneSection>
            <ActionButtonsContainer>
              <Box
                sx={{
                  width: '100%',
                  backgroundColor: 'error.main',
                  color: 'common.white',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'error.dark',
                  },
                }}
                onClick={handleOpenDeactivateDialog}
              >
                {t('sidebar.deactivate', { defaultValue: 'Deactivate Account' })}
              </Box>
              <Box
                sx={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'primary.dark',
                  padding: '13px',
                  borderRadius: '12px',
                  border: '1.5px solid',
                  borderColor: 'primary.main',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(21, 113, 69, 0.06)',
                    borderColor: 'primary.dark',
                  },
                }}
                onClick={handleLogout}
              >
                {t('sidebar.logout', { defaultValue: 'Logout' })}
              </Box>
            </ActionButtonsContainer>
          </DangerZoneSection>

          {/* Language Selector */}
          <LanguageContainer>
            <LanguageSelector compact />
          </LanguageContainer>
        </SettingsCard>
      </SettingsContent>

      {/* Deactivation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeactivateDialogOpen}
        titleKey="modal.deactivateTitle"
        messageKey="modal.deactivateConfirmation"
        confirmButtonTextKey="modal.deactivate"
        onConfirm={handleDeactivate}
        onCancel={handleCloseDeactivateDialog}
      />
    </SettingsMainContainer>
  );
};

export default SettingsMainPage;
