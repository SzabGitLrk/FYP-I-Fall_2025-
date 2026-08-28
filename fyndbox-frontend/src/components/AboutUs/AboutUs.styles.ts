import { Box, styled, Typography } from '@mui/material';

export const AboutContent = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.1),
  color: '#202924',
}));

export const AboutIntro = styled(Typography)(() => ({
  color: '#4C5B54',
  fontSize: '1.04rem',
  lineHeight: 1.65,
  fontWeight: 500,
  letterSpacing: 0,
  maxWidth: 1080,
}));

export const AboutFeatureGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: theme.spacing(0.8),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const AboutFeatureCard = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '48px 1fr',
  gap: theme.spacing(0.9),
  alignItems: 'start',
  minHeight: 'auto',
  padding: theme.spacing(1.1),
  borderRadius: 12,
  backgroundColor: '#F6F9F7',
  border: '1px solid rgba(20, 34, 27, 0.08)',
  boxShadow: 'inset 0 1px 5px rgba(18, 32, 24, 0.035)',
  '& h3': {
    margin: 0,
    color: '#13291F',
    fontSize: '1rem',
    lineHeight: 1.2,
    fontWeight: 800,
  },
  '& p': {
    margin: theme.spacing(0.4, 0, 0),
    color: '#4C5B54',
    fontSize: '0.86rem',
    lineHeight: 1.38,
    fontWeight: 500,
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '42px 1fr',
    padding: theme.spacing(1),
  },
}));

export const AboutFeatureIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 12,
  color: theme.palette.common.white,
  background: 'linear-gradient(180deg, #149052 0%, #07763F 100%)',
  boxShadow: '0 10px 22px rgba(21, 113, 69, 0.2)',
  '& .MuiSvgIcon-root': {
    fontSize: 26,
  },
  [theme.breakpoints.down('sm')]: {
    width: 42,
    height: 42,
    '& .MuiSvgIcon-root': {
      fontSize: 23,
    },
  },
}));

export const AboutSummary = styled(Typography)(({ theme }) => ({
  color: '#385548',
  fontSize: '0.95rem',
  lineHeight: 1.4,
  fontWeight: 600,
  padding: theme.spacing(0.9, 1.2),
  borderRadius: 12,
  backgroundColor: 'rgba(21, 113, 69, 0.08)',
  border: '1px solid rgba(21, 113, 69, 0.1)',
}));

export const AboutContact = styled(Typography)(({ theme }) => ({
  color: '#4C5B54',
  fontSize: '0.91rem',
  lineHeight: 1.42,
  fontWeight: 500,
  '& a': {
    color: theme.palette.primary.main,
    fontWeight: 800,
  },
}));
