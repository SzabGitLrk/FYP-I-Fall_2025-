import { Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

export const AboutPageContainer = styled(Box)(() => ({
  minHeight: '100dvh',
  background:
    'radial-gradient(circle at 12% 12%, rgba(21, 113, 69, 0.14), transparent 30%), linear-gradient(180deg, #F6FAF7 0%, #EDF5EF 100%)',
  color: '#17372A',
}));

export const AboutPageShell = styled(Container)(({ theme }) => ({
  maxWidth: '980px !important',
  padding: theme.spacing(3, 2, 5),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(5, 3, 7),
  },
}));

export const AboutCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 28,
  backgroundColor: 'rgba(255, 255, 255, 0.78)',
  border: '1px solid rgba(21, 113, 69, 0.12)',
  boxShadow: '0 24px 70px rgba(16, 66, 42, 0.12)',
  backdropFilter: 'blur(16px)',
  '& .MuiTypography-h1': {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    letterSpacing: 0,
    marginBottom: theme.spacing(1),
  },
  '& .MuiTypography-body1': {
    fontWeight: 500,
    lineHeight: 1.7,
    color: '#3E5C4E',
  },
  '& .MuiTypography-body2': {
    lineHeight: 1.65,
    color: '#3E5C4E',
  },
  '& a': {
    color: theme.palette.primary.main,
    fontWeight: 800,
  },
}));
