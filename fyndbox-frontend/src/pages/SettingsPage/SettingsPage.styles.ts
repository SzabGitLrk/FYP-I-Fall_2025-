import { Box, Button, styled } from '@mui/material';

export const SettingsCardContent = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(0.9),
  minHeight: 'auto',
  alignContent: 'center',
  '& .settings-back-button': {
    justifySelf: 'start',
    marginBottom: theme.spacing(0.6),
  },
  '& .settings-content': {
    width: '100%',
  },
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
    minHeight: 52,
    borderRadius: 8,
    padding: theme.spacing(0, 1.5),
    backgroundColor: '#F2F5F3',
    border: '1px solid rgba(20, 34, 27, 0.08)',
    boxShadow: 'inset 0 1px 5px rgba(18, 32, 24, 0.05)',
    transition:
      'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
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
    '&.Mui-disabled': {
      backgroundColor: '#EEF2F0',
    },
  },
  '& .MuiInputBase-input': {
    color: '#202924',
    fontSize: '1.1rem',
    fontWeight: 500,
    letterSpacing: 0,
    padding: theme.spacing(1, 0),
    WebkitTextFillColor: '#202924',
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#7D8580',
    fontSize: '1.35rem',
  },
  '& .MuiIconButton-root': {
    color: '#0B7643',
  },
  '& [class*="ButtonsGroupWrapper"]': {
    width: '100%',
    padding: theme.spacing(1.8, 0, 0),
    gap: theme.spacing(1.1),
  },
  '& [class*="ButtonsGroupWrapper"] .MuiButton-root': {
    width: '100%',
    minWidth: 0,
    minHeight: 52,
    borderRadius: 13,
    textTransform: 'none',
    fontSize: '1.05rem',
    fontWeight: 800,
    background: 'linear-gradient(180deg, #149052 0%, #07763F 100%)',
    color: theme.palette.primary.contrastText,
    boxShadow: 'inset 0 4px 9px rgba(4, 80, 38, 0.2)',
    '&:hover': {
      background: 'linear-gradient(180deg, #118448 0%, #066B39 100%)',
      boxShadow: 'inset 0 4px 9px rgba(4, 80, 38, 0.22)',
    },
    '&.Mui-disabled': {
      background: 'linear-gradient(180deg, #7BAF92 0%, #6B9F84 100%)',
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.8),
    '& .settings-back-button': {
      marginBottom: theme.spacing(0.5),
    },
    '& .MuiFormLabel-root': {
      marginBottom: theme.spacing(0.8),
      fontSize: '0.9rem',
    },
    '& .MuiInputBase-root': {
      minHeight: 48,
    },
    '& .MuiInputBase-input': {
      fontSize: '0.95rem',
    },
    '& [class*="ButtonsGroupWrapper"] .MuiButton-root': {
      minHeight: 48,
      fontSize: '0.95rem',
    },
  },
}));

export const SettingsBackButton = styled(Button)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.2),
  padding: 0,
  minWidth: 0,
  color: theme.palette.primary.main,
  textTransform: 'none',
  fontSize: '1.05rem',
  fontWeight: 600,
  backgroundColor: 'transparent',
  '& .MuiSvgIcon-root': {
    width: 40,
    height: 40,
    padding: theme.spacing(1),
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    boxShadow: '0 2px 8px rgba(21, 113, 69, 0.25)',
    transition: 'all 0.2s ease',
  },
  '&:hover': {
    backgroundColor: 'transparent',
    '& .MuiSvgIcon-root': {
      backgroundColor: theme.palette.primary.dark,
      transform: 'scale(1.05)',
      boxShadow: '0 3px 12px rgba(21, 113, 69, 0.35)',
    },
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.95rem',
    gap: theme.spacing(1),
    '& .MuiSvgIcon-root': {
      width: 36,
      height: 36,
    },
  },
}));

export const SettingsCardFrame = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'wide',
})<{ wide?: boolean }>(({ wide }) => ({
  width: '100%',
  maxWidth: wide ? 1240 : 668,
  '& > .MuiBox-root': {
    maxWidth: wide ? 1240 : 668,
  },
}));
