import { Box, Button, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowBack } from '@mui/icons-material';

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
  position: 'relative',
  padding: theme.spacing(5, 3, 3),
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

export const GoBackButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  minWidth: 'unset',
  width: 40,
  height: 40,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 2px 8px rgba(21, 113, 69, 0.25)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.05)',
    boxShadow: '0 3px 12px rgba(21, 113, 69, 0.35)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.3rem',
  },
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
}));

export const StyledArrowBack = styled(ArrowBack)({});
