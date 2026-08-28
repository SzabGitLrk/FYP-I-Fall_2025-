import { Avatar, Box, Button, styled } from '@mui/material';

export const SettingsMainContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100dvh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(5.5, 2, 2.5),
  backgroundColor: '#ffffff',
  color: '#14221B',
  fontFamily: '"Segoe UI", Arial, sans-serif',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '0 0 auto',
    height: '52%',
    minHeight: 360,
    background:
      'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
    zIndex: 0,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: '-12%',
    right: '-12%',
    top: '36%',
    height: 210,
    backgroundColor: '#ffffff',
    borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
    boxShadow: '0 -16px 34px rgba(255, 255, 255, 0.84)',
    zIndex: 0,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3.2, 1.5, 1.7),
    '&::before': {
      height: 350,
      minHeight: 350,
    },
    '&::after': {
      top: 274,
      height: 132,
      left: '-28%',
      right: '-28%',
    },
  },
}));

export const DecorativeLayer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1,
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    width: 116,
    height: 92,
    opacity: 0.45,
    background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0 3px, transparent 3.4px)',
    backgroundSize: '18px 18px',
  },
  '&::before': {
    top: 100,
    left: '5.2%',
  },
  '&::after': {
    top: 262,
    right: '5.2%',
  },
  [theme.breakpoints.down('sm')]: {
    '&::before': {
      top: 88,
      left: 18,
      transform: 'scale(0.72)',
      transformOrigin: 'top left',
    },
    '&::after': {
      top: 212,
      right: 8,
      transform: 'scale(0.66)',
      transformOrigin: 'top right',
    },
  },
}));

export const SoftCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'placement',
})<{ placement: 'left' | 'right' | 'top' }>(({ placement, theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  ...(placement === 'left' && {
    width: 132,
    height: 132,
    left: '8%',
    top: 352,
  }),
  ...(placement === 'right' && {
    width: 76,
    height: 76,
    right: '23%',
    top: 54,
  }),
  ...(placement === 'top' && {
    width: 580,
    height: 580,
    left: '-1%',
    top: -408,
  }),
  [theme.breakpoints.down('sm')]: {
    display: placement === 'top' ? 'block' : 'none',
    ...(placement === 'top' && {
      width: 360,
      height: 360,
      top: -246,
      left: -130,
    }),
  },
}));

export const SettingsHeader = styled(Box)(({ theme }) => ({
  display: 'none',
}));

export const SettingsHeaderBackButton = styled(Button)({
  display: 'none',
});

export const SettingsHeaderTitle = styled(Box)({
  display: 'none',
});

export const SettingsContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  gap: theme.spacing(2.2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.6),
  },
}));

export const SettingsCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 668,
  padding: theme.spacing(3.6, 4.2, 2.6),
  borderRadius: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid rgba(16, 66, 42, 0.04)',
  boxShadow: '0 20px 42px rgba(31, 43, 37, 0.16)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.3),
  [theme.breakpoints.down('sm')]: {
    maxWidth: 430,
    padding: theme.spacing(2.4, 1.8, 1.8),
    borderRadius: 14,
    gap: theme.spacing(1),
  },
}));

export const ProfileSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  textAlign: 'center',
  paddingBottom: theme.spacing(1.5),
  borderBottom: '1px solid rgba(21, 113, 69, 0.1)',
}));

export const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  objectFit: 'cover',
  backgroundColor: theme.palette.primary.main,
  border: '4px solid rgba(255, 255, 255, 0.9)',
  boxShadow: '0 16px 32px rgba(31, 43, 37, 0.14)',
  color: theme.palette.common.white,
  fontSize: '1.8rem',
  fontWeight: 900,
}));

export const ProfileInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const ProfileName = styled(Box)({
  color: '#121A16',
  fontSize: '1.15rem',
  fontWeight: 700,
  lineHeight: 1.2,
});

export const ProfileEmail = styled(Box)({
  color: '#66756C',
  fontSize: '0.9rem',
  fontWeight: 500,
  lineHeight: 1.3,
});

export const EditProfileLink = styled(Box)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.dark,
  },
}));

export const MenuSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const MenuCard = styled(Box)({
  borderRadius: 12,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F4FBF6 100%)',
  border: '1px solid rgba(21, 113, 69, 0.18)',
  boxShadow: '0 8px 24px rgba(15, 57, 39, 0.08)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(20, 54, 39, 0.13)',
    transform: 'translateX(4px)',
  },
});

export const MenuCardButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2),
  textTransform: 'none',
  color: theme.palette.primary.dark,
  minWidth: 'unset',
  borderRadius: 12,
  fontWeight: 600,
  '&:hover': {
    backgroundColor: 'transparent',
  },
  '& > .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    fontSize: '1.35rem',
  },
}));

export const MenuCardContent = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flex: 1,
});

export const MenuCardLabel = styled(Box)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontSize: '1.05rem',
  fontWeight: 600,
  minWidth: 0,
}));

export const DividerLine = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: 'rgba(21, 113, 69, 0.1)',
  margin: theme.spacing(0.5, 0),
}));

export const DangerZoneSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1.5),
}));

export const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  width: '100%',
}));

export const LanguageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: theme.spacing(1),
  '& [class*="LanguageSelectorWrapper"]': {
    color: '#17231C',
  },
}));

export const BackButtonStyle = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  minWidth: 'unset',
  width: 40,
  height: 40,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 2px 8px rgba(21, 113, 69, 0.25)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.05)',
    boxShadow: '0 3px 12px rgba(21, 113, 69, 0.35)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.3rem',
  },
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
}));
