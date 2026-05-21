import { AppBar, Box, styled, Toolbar } from '@mui/material';

export const AppBarContainer = styled(AppBar)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
  color: theme.palette.common.white,
  minHeight: 154,
  boxShadow: 'none',
  borderRadius: 0,
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    pointerEvents: 'none',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  '&::before': {
    width: 520,
    height: 520,
    left: -190,
    top: -392,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  '&::after': {
    width: 76,
    height: 76,
    right: '18%',
    top: 34,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: 176,
    borderRadius: 0,
  },
}));

export const HeaderDotPattern = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing(6),
  top: theme.spacing(4.3),
  width: 116,
  height: 92,
  opacity: 0.45,
  pointerEvents: 'none',
  background:
    'radial-gradient(circle, rgba(255,255,255,0.5) 0 3px, transparent 3.4px)',
  backgroundSize: '18px 18px',
  [theme.breakpoints.down('md')]: {
    left: theme.spacing(2.4),
    top: theme.spacing(7),
    transform: 'scale(0.72)',
    transformOrigin: 'top left',
  },
}));

export const ToolbarContainer = styled(Toolbar)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  minHeight: '154px !important',
  padding: `${theme.spacing(3.2, 5.2)} !important`,
  '& .MuiIconButton-root': {
    color: theme.palette.common.white,
  },
  [theme.breakpoints.down('md')]: {
    alignItems: 'flex-start',
    minHeight: '176px !important',
    padding: `${theme.spacing(3, 2, 0)} !important`,
    '& .MuiIconButton-root': {
      color: theme.palette.common.white,
    },
  },
}));

export const MobileHeaderStack = styled(Box)(({ theme }) => ({
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(0.6),
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    display: 'grid',
    justifyItems: 'start',
    textAlign: 'left',
    gap: theme.spacing(2.2),
  },
}));

export const HeaderSubtitle = styled(Box)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '1rem',
  fontWeight: 500,
  letterSpacing: 0,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export const MobileBrandLockup = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.8),
    color: '#C7D92D',
    fontSize: '1rem',
    fontWeight: 800,
    '& img': {
      width: 44,
      height: 44,
      objectFit: 'contain',
      borderRadius: '50%',
      boxShadow: '0 8px 18px rgba(0, 27, 13, 0.22)',
    },
  },
}));

export const NotificationSlot = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(5.2),
  top: theme.spacing(4.4),
  [theme.breakpoints.down('md')]: {
    right: theme.spacing(2),
    top: theme.spacing(3),
  },
}));
