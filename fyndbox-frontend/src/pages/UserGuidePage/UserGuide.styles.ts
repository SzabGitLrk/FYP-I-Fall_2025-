import { Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowBack } from '@mui/icons-material';

export const UserGuidePageShell = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100dvh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
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

export const UserGuideContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  width: '100%',
  maxWidth: 668,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2.2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.6),
  },
}));

export const GoBackButton = styled(Button)(({ theme }) => ({
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(0.5),
  color: theme.palette.primary.main,
  textTransform: 'none',
  fontSize: '1.05rem',
  fontWeight: 600,
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'transparent',
    '& .go-back-icon': {
      backgroundColor: theme.palette.primary.dark,
      transform: 'scale(1.05)',
    },
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.95rem',
    gap: theme.spacing(1.2),
  },
}));

export const GoBackIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  boxShadow: '0 2px 8px rgba(21, 113, 69, 0.25)',
  transition: 'all 0.2s ease',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: '1.3rem',
  },
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
}));

export const StyledArrowBack = styled(ArrowBack)(({ theme }) => ({
  fontSize: '1.3rem',
}));

export const UserGuideTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: '2.3rem',
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: 0,
  textAlign: 'center',
  textShadow: '0 10px 24px rgba(10, 62, 35, 0.22)',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.85rem',
  },
}));

export const UserGuideDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: '1.05rem',
  lineHeight: 1.5,
  textAlign: 'center',
  textShadow: '0 4px 12px rgba(10, 62, 35, 0.18)',
  maxWidth: 540,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.95rem',
  },
}));

export const GuideCard = styled(Box)(({ theme }) => ({
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
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    maxWidth: 430,
    padding: theme.spacing(2.4, 1.8, 1.8),
    borderRadius: 14,
  },
}));

export const StepperWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  '& .MuiMobileStepper-root': {
    background: 'transparent',
    padding: theme.spacing(2, 0),
  },
  '& .MuiMobileStepper-dot': {
    backgroundColor: 'rgba(21, 113, 69, 0.2)',
    width: 10,
    height: 10,
  },
  '& .MuiMobileStepper-dotActive': {
    backgroundColor: theme.palette.primary.main,
  },
  '& .MuiButton-root': {
    color: theme.palette.primary.main,
    fontWeight: 600,
    textTransform: 'none',
    '&.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.26)',
    },
  },
}));

export const BecomeMemberButton = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: 56,
  marginTop: theme.spacing(1),
  borderRadius: 13,
  fontSize: '1.05rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.84)',
  border: '1.5px solid',
  borderColor: theme.palette.primary.main,
  color: theme.palette.primary.main,
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(21, 113, 69, 0.2)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: 48,
    fontSize: '0.95rem',
  },
}));

export const LanguageWrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  width: '100%',
  '& [class*="LanguageSelectorWrapper"]': {
    padding: theme.spacing(0.5, 0, 0),
    color: '#17231C',
  },
  [theme.breakpoints.down('sm')]: {
    '& [class*="LanguageSelectorWrapper"]': {
      flexWrap: 'wrap',
      rowGap: theme.spacing(0.6),
    },
  },
}));
