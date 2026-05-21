import { Box, Button, styled, Typography } from '@mui/material';

export const ForgotPasswordBody = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.8),
  minHeight: 500,
  alignContent: 'center',
  '& [class*="FieldStack"]': {
    marginTop: theme.spacing(0.6),
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: 430,
    gap: theme.spacing(1.4),
  },
}));

export const ForgotPasswordDescription = styled(Typography)(({ theme }) => ({
  color: '#5E6573',
  fontSize: '1.08rem',
  lineHeight: 1.55,
  fontWeight: 500,
  letterSpacing: 0,
  maxWidth: 520,
  marginBottom: theme.spacing(0.7),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.98rem',
    lineHeight: 1.45,
  },
}));

export const SendButton = styled(Button)(({ theme }) => ({
  width: '100%',
  minWidth: 0,
  minHeight: 61,
  marginTop: theme.spacing(1.9),
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
  [theme.breakpoints.down('sm')]: {
    minHeight: 52,
    marginTop: theme.spacing(1.2),
    fontSize: '1rem',
  },
}));
