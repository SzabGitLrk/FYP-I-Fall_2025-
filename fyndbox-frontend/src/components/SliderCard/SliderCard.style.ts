import { Box, Card } from '@mui/material';
import { styled } from '@mui/material/styles';

export const CardContainer = styled(Card)(({ theme }) => ({
  backgroundColor: '#F2F5F3',
  borderRadius: 12,
  padding: theme.spacing(3, 2.5),
  boxShadow: 'inset 0 1px 3px rgba(18, 32, 24, 0.08)',
  border: '1px solid rgba(20, 34, 27, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  minHeight: 200,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(31, 43, 37, 0.1)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5, 2),
    minHeight: 180,
  },
}));

export const StepCounter = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  width: 64,
  height: 64,
  color: '#FFFFFF',
  background: 'linear-gradient(135deg, #89B799 0%, #5D9D71 52%, #498B60 100%)',
  boxShadow: '0 4px 12px rgba(21, 113, 69, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
  fontWeight: 800,
  fontSize: '1.5rem',
  flexShrink: 0,
  border: '2px solid rgba(255, 255, 255, 0.3)',
  [theme.breakpoints.down('sm')]: {
    width: 56,
    height: 56,
    fontSize: '1.3rem',
  },
}));

export const StepTitle = styled(Box)(({ theme }) => ({
  color: '#121A16',
  fontSize: '1.35rem',
  fontWeight: 700,
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.2rem',
  },
}));

export const StepDescription = styled(Box)(({ theme }) => ({
  color: '#5B6660',
  fontSize: '1rem',
  lineHeight: 1.6,
  fontWeight: 400,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.95rem',
  },
}));
