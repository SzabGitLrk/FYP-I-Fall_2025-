import { Box, Button, styled } from '@mui/material';

export const SettingsCardContent = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.4),
  minHeight: 543,
  alignContent: 'center',
  '& .settings-back-button': {
    justifySelf: 'start',
    marginBottom: theme.spacing(1.4),
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
    marginBottom: theme.spacing(1.1),
    color: '#72777D',
    fontSize: '1rem',
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
    minHeight: 58,
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
    fontSize: '1.2rem',
    fontWeight: 500,
    letterSpacing: 0,
    padding: theme.spacing(1.2, 0),
    WebkitTextFillColor: '#202924',
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#7D8580',
    fontSize: '1.45rem',
  },
  '& .MuiIconButton-root': {
    color: '#0B7643',
  },
  '& [class*="ButtonsGroupWrapper"]': {
    width: '100%',
    padding: theme.spacing(3, 0, 1.2),
    gap: theme.spacing(1.4),
  },
  '& [class*="ButtonsGroupWrapper"] .MuiButton-root': {
    width: '100%',
    minWidth: 0,
    minHeight: 61,
    borderRadius: 13,
    textTransform: 'none',
    fontSize: '1.12rem',
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
    minHeight: 455,
    '& .MuiInputBase-root': {
      minHeight: 52,
    },
    '& .MuiInputBase-input': {
      fontSize: '1rem',
    },
    '& [class*="ButtonsGroupWrapper"] .MuiButton-root': {
      minHeight: 52,
      fontSize: '1rem',
    },
  },
}));

export const SettingsBackButton = styled(Button)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: 0,
  minWidth: 0,
  color: theme.palette.primary.main,
  textTransform: 'none',
  fontSize: '1.15rem',
  fontWeight: 700,
  '&:hover': {
    backgroundColor: 'transparent',
    color: theme.palette.primary.dark,
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
