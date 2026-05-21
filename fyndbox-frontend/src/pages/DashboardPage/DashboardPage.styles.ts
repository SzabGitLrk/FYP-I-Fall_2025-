import { Box, Container, styled } from '@mui/material';

export const DashboardContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  padding: 0,
  minHeight: '100dvh',
  display: 'flex',
  maxWidth: 'none !important',
  overflow: 'hidden',
  background: '#FBFDFB',
  color: '#063F25',
  fontFamily: '"Segoe UI", Arial, sans-serif',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 0,
  },
  '&::before': {
    width: 118,
    height: 96,
    right: 78,
    top: 6,
    opacity: 0.35,
    background:
      'radial-gradient(circle, rgba(255,255,255,0.6) 0 3px, transparent 3.4px)',
    backgroundSize: '18px 18px',
  },
  '&::after': {
    display: 'none',
  },
  [theme.breakpoints.down('md')]: {
    display: 'block',
    overflowX: 'hidden',
    background: '#FFFFFF',
    '&::before': {
      width: '100%',
      height: 330,
      top: 0,
      right: 0,
      borderBottomLeftRadius: '0',
      background:
        'linear-gradient(145deg, rgba(28, 126, 76, 0.98) 0%, rgba(4, 90, 48, 0.98) 68%, rgba(3, 78, 42, 0.98) 100%)',
    },
    '&::after': {
      left: '-18%',
      right: '-18%',
      bottom: 'auto',
      top: 244,
      width: '136%',
      height: 150,
      borderTopRightRadius: '50% 100%',
      borderTopLeftRadius: '50% 100%',
      background: '#FFFFFF',
      boxShadow: '0 -18px 34px rgba(255, 255, 255, 0.7)',
    },
  },
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: theme.spacing(1.3),
  width: '100%',
  maxWidth: 1040,
  margin: '0 auto',
  padding: theme.spacing(0, 4.4),
  paddingTop: theme.spacing(0.7),
  paddingBottom: theme.spacing(11),
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(1.9),
    maxWidth: 'none',
    margin: 0,
    padding: theme.spacing(2.2, 1.8),
    paddingTop: theme.spacing(2.8),
    paddingBottom: `calc(${theme.spacing(13.5)} + env(safe-area-inset-bottom, 0px))`,
  },
}));

export const DashboardRail = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: 280,
  flex: '0 0 280px',
  padding: theme.spacing(5.2, 3, 4),
  backgroundColor: '#FFFFFF',
  borderRight: '1px solid rgba(5, 63, 37, 0.08)',
  boxShadow: '10px 0 30px rgba(16, 48, 32, 0.04)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(5.2),
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export const BrandLockup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.1),
  paddingLeft: theme.spacing(1.3),
  color: '#157145',
  fontSize: '1.38rem',
  fontWeight: 800,
  '& img': {
    width: 48,
    height: 48,
    objectFit: 'contain',
    borderRadius: '50%',
    boxShadow: '0 10px 18px rgba(5, 83, 45, 0.14)',
  },
}));

export const RailNav = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.4),
}));

export const RailNavItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active?: boolean }>(({ theme, $active = false }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  minHeight: 62,
  padding: theme.spacing(0, 2),
  borderRadius: 8,
  color: $active ? '#063F25' : '#101915',
  backgroundColor: $active ? 'rgba(214, 229, 216, 0.78)' : 'transparent',
  fontSize: '1rem',
  fontWeight: $active ? 800 : 500,
  cursor: $active ? 'default' : 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease',
  '&:hover': {
    backgroundColor: $active
      ? 'rgba(214, 229, 216, 0.78)'
      : 'rgba(224, 235, 227, 0.58)',
  },
  '& .MuiSvgIcon-root': {
    width: 27,
    height: 27,
    color: '#07512F',
  },
}));

export const DashboardWorkspace = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  flex: 1,
  minWidth: 0,
  padding: 0,
  [theme.breakpoints.down('lg')]: {
    padding: 0,
  },
  [theme.breakpoints.down('md')]: {
    padding: 0,
  },
}));

export const DashboardContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 'none',
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    maxWidth: 'none',
  },
}));

export const SubContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.4),
  margin: theme.spacing(-0.5, 0, 1.4, 4.5),
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(1.7),
  },
}));

export const PrimaryActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  margin: theme.spacing(1.3, 0, 0),
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));
