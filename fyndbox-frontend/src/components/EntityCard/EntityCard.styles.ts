import { Box, Card, styled, Typography } from '@mui/material';

interface EntityCardContainerProps {
  isBoxCard: boolean;
}

export const EntityCardContainer = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isBoxCard',
})<EntityCardContainerProps>(({ theme, isBoxCard }) => ({
  position: 'relative',
  overflow: 'visible',
  background:
    'linear-gradient(135deg, #FFFFFF 0%, #F4FBF6 100%)',
  borderRadius: 12,
  marginBottom: isBoxCard ? theme.spacing(1.2) : theme.spacing(1.8),
  color: '#064326',
  border: '1px solid rgba(21, 113, 69, 0.18)',
  borderLeft: `6px solid ${theme.palette.primary.main}`,
  boxShadow:
    '0 18px 36px rgba(20, 42, 29, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.82) inset',
  transition:
    'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    borderColor: 'rgba(21, 113, 69, 0.3)',
    boxShadow:
      '0 24px 44px rgba(20, 42, 29, 0.18), 0 0 0 1px rgba(21, 113, 69, 0.1) inset',
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(isBoxCard ? 1.6 : 2.2, 2.6),
    '&:last-child': {
      paddingBottom: theme.spacing(isBoxCard ? 1.6 : 2.2),
    },
  },
  '& .MuiIconButton-root': {
    width: isBoxCard ? 40 : 44,
    height: isBoxCard ? 40 : 44,
    borderRadius: 8,
    color: '#064326',
    backgroundColor: 'rgba(226, 235, 228, 0.74)',
    '&:hover': {
      backgroundColor: 'rgba(210, 227, 215, 0.9)',
    },
  },
  '& .MuiSvgIcon-root': {
    color: '#064326',
    fontSize: '1.35rem !important',
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: isBoxCard ? theme.spacing(0.8) : theme.spacing(1.1),
    borderLeftWidth: 3,
    boxShadow: '0 9px 20px rgba(20, 42, 29, 0.1)',
    '& .MuiCardContent-root': {
      padding: theme.spacing(1.1, 1.1),
      '&:last-child': {
        paddingBottom: theme.spacing(1.1),
      },
    },
    '& .MuiIconButton-root': {
      width: 32,
      height: 32,
      borderRadius: 6,
    },
  },
}));

export const ImageBox = styled('img')(({ theme }) => ({
  width: 72,
  height: 72,
  marginRight: theme.spacing(2.2),
  objectFit: 'contain',
  borderRadius: 16,
  padding: theme.spacing(0.8),
  backgroundColor: '#ECF5EF',
  [theme.breakpoints.down('md')]: {
    width: 48,
    height: 48,
    marginRight: theme.spacing(1.1),
    borderRadius: 14,
    padding: theme.spacing(0.7),
  },
}));

export const ContentBox = styled(Box)({
  flex: 5,
  minWidth: 0,
});

export const NameText = styled(Typography)(({ theme }) => ({
  wordBreak: 'break-word',
  color: '#064326',
  fontSize: '1.45rem',
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: 0,
  [theme.breakpoints.down('md')]: {
    fontSize: '0.95rem',
  },
}));

export const DescriptionText = styled(Typography)(({ theme }) => ({
  wordBreak: 'break-word',
  color: '#5D6A62',
  fontSize: '0.9rem',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export const MetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(0.9),
  marginTop: theme.spacing(0.95),
}));

export const MetaChip = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minHeight: 32,
  padding: theme.spacing(0.5, 1),
  borderRadius: 7,
  backgroundColor: '#EAF4ED',
  color: '#064326',
  fontSize: '0.85rem',
  fontWeight: 700,
  '& .MuiSvgIcon-root': {
    width: 16,
    height: 16,
    color: '#157145',
    fontSize: '16px !important',
  },
  [theme.breakpoints.down('md')]: {
    minHeight: 24,
    fontSize: '0.72rem',
  },
}));

export const QuantityText = styled(Typography)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 'auto',
  minHeight: 'auto',
  padding: 0,
  borderRadius: 0,
  backgroundColor: 'transparent',
  color: '#99A09A',
  fontSize: '0.8rem',
  fontWeight: 400,
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('md')]: {
    minWidth: 'auto',
    minHeight: 'auto',
    fontSize: '0.7rem',
  },
}));
