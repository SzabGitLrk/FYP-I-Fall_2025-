import { Box, styled, Typography } from '@mui/material';

export const LoginPageShell = styled(Box)(({ theme }) => ({
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

export const LoginContent = styled(Box)(({ theme }) => ({
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

export const BrandBlock = styled(Box)(({ theme }) => ({
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(0.6),
  color: theme.palette.common.white,
  fontWeight: 800,
  fontSize: '1.8rem',
  lineHeight: 1,
  textShadow: '0 10px 24px rgba(10, 62, 35, 0.22)',
  '& img': {
    width: 100,
    height: 100,
    objectFit: 'contain',
    borderRadius: '50%',
    filter: 'drop-shadow(0 14px 18px rgba(9, 67, 36, 0.2))',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.45rem',
    '& img': {
      width: 76,
      height: 76,
    },
  },
}));

export const LoginCard = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 668,
  padding: theme.spacing(3.6, 4.2, 2.6),
  borderRadius: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid rgba(16, 66, 42, 0.04)',
  boxShadow: '0 20px 42px rgba(31, 43, 37, 0.16)',
  backdropFilter: 'blur(12px)',
  '& form': {
    display: 'grid',
    gap: theme.spacing(1.3),
  },
  '& [class*="ButtonsGroupWrapper"]': {
    padding: theme.spacing(1.9, 0, 0.8),
    gap: theme.spacing(1.1),
  },
  '& .MuiButton-root': {
    width: '100%',
    minWidth: 0,
    minHeight: 56,
    borderRadius: 13,
    fontSize: '1.05rem',
    fontWeight: 800,
    boxShadow: 'none',
  },
  '& .MuiButton-contained': {
    background: 'linear-gradient(180deg, #149052 0%, #07763F 100%)',
    boxShadow: 'inset 0 4px 9px rgba(4, 80, 38, 0.2)',
  },
  '& .MuiButton-outlined': {
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: 430,
    padding: theme.spacing(2.4, 1.8, 1.8),
    borderRadius: 14,
    '& form': {
      gap: theme.spacing(1),
    },
    '& .MuiButton-root': {
      minHeight: 48,
      fontSize: '0.95rem',
    },
    '& [class*="ButtonsGroupWrapper"]': {
      padding: theme.spacing(1.5, 0, 0.6),
      gap: theme.spacing(0.9),
    },
  },
}));

export const LoginTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1.6),
  color: '#121A16',
  fontSize: '2.3rem',
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.85rem',
    marginBottom: theme.spacing(1.3),
  },
}));

export const FieldStack = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.3),
  '& .MuiTextField-root': {
    margin: 0,
  },
  '& .MuiFormLabel-root': {
    position: 'relative',
    transform: 'none',
    marginBottom: theme.spacing(0.85),
    color: '#72777D',
    fontSize: '0.95rem',
    lineHeight: 1.2,
    fontWeight: 500,
    letterSpacing: 0,
    '&.Mui-focused': {
      color: '#5B6660',
    },
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  '& .MuiInputBase-root': {
    minHeight: 56,
    borderRadius: 8,
    padding: theme.spacing(0, 1.5),
    backgroundColor: '#F2F5F3',
    border: '1px solid rgba(20, 34, 27, 0.08)',
    boxShadow: 'inset 0 1px 5px rgba(18, 32, 24, 0.05)',
    transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
    '&::before, &::after': {
      display: 'none',
    },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF',
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 3px rgba(21, 113, 69, 0.11)',
    },
    '&.Mui-error': {
      borderColor: theme.palette.error.main,
    },
  },
  '& .MuiInputBase-input': {
    color: '#202924',
    fontSize: '1.1rem',
    fontWeight: 500,
    letterSpacing: 0,
    padding: theme.spacing(1, 0),
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#7D8580',
    fontSize: '1.35rem',
  },
  '& .MuiIconButton-root': {
    color: '#7D8580',
    padding: theme.spacing(0.5),
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    fontWeight: 600,
  },
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
    '& .MuiInputBase-root': {
      minHeight: 48,
    },
    '& .MuiInputBase-input': {
      fontSize: '0.95rem',
    },
  },
}));

export const ErrorText = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginTop: theme.spacing(1),
  textAlign: 'center',
  fontWeight: 700,
}));

export const ForgotPasswordLink = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginTop: theme.spacing(1.2),
  textAlign: 'center',
  color: '#202924',
  fontSize: '1rem',
  fontWeight: 500,
  '& a': {
    color: 'inherit',
    textDecoration: 'none',
  },
  '& a:hover': {
    color: theme.palette.primary.dark,
    textDecoration: 'underline',
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
