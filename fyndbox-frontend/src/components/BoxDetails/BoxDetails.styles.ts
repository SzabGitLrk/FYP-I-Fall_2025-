import { Box, Chip, styled, Typography } from '@mui/material';

export const ImageBox = styled('img')(({}) => ({
  width: 108,
  height: 108,
  objectFit: 'contain',
}));

export const BoxDetailsContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.8),
  minHeight: 128,
  margin: theme.spacing(2, 0, 3),
  padding: theme.spacing(1.9, 2.6),
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(21, 113, 69, 0.08)',
  boxShadow: '0 12px 28px rgba(20, 42, 29, 0.08)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 0,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    right: -90,
    top: -130,
    width: 250,
    height: 250,
    borderRadius: '50%',
    backgroundColor: 'rgba(137, 183, 153, 0.08)',
  },
  [theme.breakpoints.down('md')]: {
    alignItems: 'flex-start',
    gap: theme.spacing(1.6),
    marginTop: theme.spacing(1.4),
    padding: theme.spacing(1.6),
  },
}));

export const ImageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '0 0 120px',
  width: 120,
  height: 120,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.68)',
  boxShadow: 'inset 0 0 0 1px rgba(21, 113, 69, 0.04)',
  [theme.breakpoints.down('md')]: {
    flexBasis: 72,
    width: 72,
    height: 72,
    '& img': {
      width: 64,
      height: 64,
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
  fontSize: '1.5rem',
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: 0,
  [theme.breakpoints.down('md')]: {
    fontSize: '1.15rem',
  },
}));

export const DetailsDescription = styled(Typography)(({}) => ({
  color: '#4D5C54',
  fontSize: '0.88rem',
  fontWeight: 500,
}));

export const DetailsMeta = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(0.9),
  marginTop: theme.spacing(1.5),
}));

export const DetailsChip = styled(Chip)(({}) => ({
  height: 30,
  borderRadius: 7,
  backgroundColor: '#FFFFFF',
  color: '#064326',
  fontWeight: 700,
  fontSize: '0.82rem',
  boxShadow: '0 6px 14px rgba(20, 42, 29, 0.08)',
  '& .MuiChip-icon': {
    color: '#157145',
    width: 16,
    height: 16,
    fontSize: '16px !important',
  },
}));

export const FavoriteButtonWrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(0.4),
  '& .MuiIconButton-root': {
    width: 40,
    height: 40,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    color: '#064326',
    boxShadow: '0 8px 18px rgba(20, 42, 29, 0.1)',
  },
  '& .MuiTypography-root': {
    color: '#4D5C54',
    fontWeight: 600,
    fontSize: '0.75rem',
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
