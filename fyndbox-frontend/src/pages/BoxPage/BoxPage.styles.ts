import { Box, Container, IconButton, styled, Typography } from '@mui/material';
import { BaseButton } from '../../styles/commonStyles';

export const BoxContainer = styled(Container)(({ theme }) => ({
  padding: 0,
  minHeight: '100dvh',
  display: 'flex',
  maxWidth: 'none !important',
  background: '#FBFDFB',
  color: '#063F25',
  [theme.breakpoints.down('md')]: {
    display: 'block',
  },
}));

export const BoxMain = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$sidebarCollapsed',
})<{ $sidebarCollapsed?: boolean }>(({ theme, $sidebarCollapsed = false }) => ({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  marginLeft: $sidebarCollapsed ? 100 : 330,
  width: `calc(100% - ${$sidebarCollapsed ? 100 : 330}px)`,
  padding: theme.spacing(2.2, 4.4, 0),
  transition: 'margin-left 220ms ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    background:
      'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
    zIndex: 0,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: theme.spacing(6),
    top: theme.spacing(4.2),
    width: 116,
    height: 92,
    opacity: 0.45,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle, rgba(255,255,255,0.5) 0 3px, transparent 3.4px)',
    backgroundSize: '18px 18px',
    zIndex: 0,
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    width: '100%',
    padding: theme.spacing(1, 1.6, 0),
    '&::before': {
      height: 150,
    },
    '&::after': {
      left: theme.spacing(2.4),
      top: theme.spacing(5.5),
      transform: 'scale(0.72)',
      transformOrigin: 'top left',
    },
  },
}));

export const BoxContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 1040,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  paddingBottom: `calc(${theme.spacing(1)} + env(safe-area-inset-bottom, 0px))`,
  [theme.breakpoints.down('md')]: {
    paddingBottom: `calc(${theme.spacing(10)} + env(safe-area-inset-bottom, 0px))`,
  },
}));

export const BoxHeaderSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  flex: '0 0 auto',
  paddingBottom: theme.spacing(2),
}));

export const ItemsScrollContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  paddingRight: '4px',
  paddingBottom: theme.spacing(2),
  /* Custom Scrollbar Styling - Matches Dashboard */
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(21, 113, 69, 0.45) rgba(5, 63, 37, 0.08)',
  '&::-webkit-scrollbar': {
    width: 10,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(5, 63, 37, 0.06)',
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(21, 113, 69, 0.38)',
    borderRadius: 999,
    border: '2px solid rgba(251, 253, 251, 0.9)',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(21, 113, 69, 0.58)',
  },
}));

export const ItemsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: theme.spacing(0, 0, 2),
}));

export const ItemsTitle = styled(Typography)(({}) => ({
  color: '#99A09A',
  fontSize: '0.8rem',
  fontWeight: 400,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
  margin: 0,
}));

export const PrintQRButton = styled(BaseButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3, 0, 2),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export const BackButton = styled(IconButton)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  textAlign: 'left',
  padding: theme.spacing(1.2, 0),
  color: theme.palette.common.white,
  borderRadius: 8,
  '& .MuiTypography-root': {
    color: theme.palette.common.white,
    fontWeight: 900,
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
}));



