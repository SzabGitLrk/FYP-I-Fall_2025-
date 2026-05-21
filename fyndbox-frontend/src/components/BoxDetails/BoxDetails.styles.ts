import { Box, Chip, styled, Typography } from '@mui/material';

export const ImageBox = styled('img')(({}) => ({
  width: 136,
  height: 136,
  objectFit: 'contain',
}));

export const BoxDetailsContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3.5),
  minHeight: 156,
  margin: theme.spacing(2.5, 0, 3.8),
  padding: theme.spacing(2.4, 3.2),
  borderRadius: 8,
  background:
    'linear-gradient(135deg, rgba(240, 247, 242, 0.96) 0%, rgba(232, 242, 235, 0.88) 100%)',
  border: '1px solid rgba(12, 64, 38, 0.06)',
  boxShadow: '0 12px 28px rgba(20, 42, 29, 0.08)',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    right: -90,
    top: -130,
    width: 250,
    height: 250,
    borderRadius: '50%',
    backgroundColor: 'rgba(137, 183, 153, 0.14)',
  },
  [theme.breakpoints.down('md')]: {
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1.8),
    padding: theme.spacing(2),
  },
}));

export const ImageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '0 0 152px',
  width: 152,
  height: 152,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.68)',
  boxShadow: 'inset 0 0 0 1px rgba(21, 113, 69, 0.04)',
  [theme.breakpoints.down('md')]: {
    flexBasis: 86,
    width: 86,
    height: 86,
    '& img': {
      width: 78,
      height: 78,
    },
  },
}));

export const DetailsContent = styled(Box)(({}) => ({
  position: 'relative',
  zIndex: 1,
  flex: 1,
  minWidth: 0,
}));

export const DetailsTitle = styled(Typography)(({ theme }) => ({
  color: '#063F25',
  fontSize: '1.75rem',
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: 0,
  [theme.breakpoints.down('md')]: {
    fontSize: '1.35rem',
  },
}));

export const DetailsDescription = styled(Typography)(({}) => ({
  color: '#4D5C54',
  fontSize: '1rem',
  fontWeight: 500,
}));

export const DetailsMeta = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1.2),
  marginTop: theme.spacing(2),
}));

export const DetailsChip = styled(Chip)(({}) => ({
  height: 34,
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  color: '#064326',
  fontWeight: 800,
  boxShadow: '0 6px 14px rgba(20, 42, 29, 0.08)',
  '& .MuiChip-icon': {
    color: '#157145',
  },
}));

export const FavoriteButtonWrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(0.5),
  '& .MuiIconButton-root': {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#064326',
    boxShadow: '0 8px 18px rgba(20, 42, 29, 0.1)',
  },
  '& .MuiTypography-root': {
    color: '#4D5C54',
    fontWeight: 600,
  },
  [theme.breakpoints.down('sm')]: {
    position: 'absolute',
    right: theme.spacing(1.4),
    top: theme.spacing(1.4),
    '& .MuiTypography-root': {
      display: 'none',
    },
  },
}));
