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
  marginBottom: isBoxCard ? theme.spacing(1.6) : theme.spacing(2.4),
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
    padding: theme.spacing(isBoxCard ? 2.1 : 2.8, 3.2),
    '&:last-child': {
      paddingBottom: theme.spacing(isBoxCard ? 2.1 : 2.8),
    },
  },
  '& .MuiIconButton-root': {
    width: isBoxCard ? 44 : 50,
    height: isBoxCard ? 44 : 50,
    borderRadius: 8,
    color: '#064326',
    backgroundColor: 'rgba(226, 235, 228, 0.74)',
    '&:hover': {
      backgroundColor: 'rgba(210, 227, 215, 0.9)',
    },
  },
  '& .MuiSvgIcon-root': {
    color: '#064326',
    fontSize: '1.55rem !important',
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: isBoxCard ? theme.spacing(1) : theme.spacing(1.45),
    borderLeftWidth: 3,
    boxShadow: '0 9px 20px rgba(20, 42, 29, 0.1)',
    '& .MuiCardContent-root': {
      padding: theme.spacing(1.35, 1.4),
      '&:last-child': {
        paddingBottom: theme.spacing(1.35),
      },
    },
    '& .MuiIconButton-root': {
      width: 34,
      height: 34,
      borderRadius: 7,
    },
  },
}));

export const ImageBox = styled('img')(({ theme }) => ({
  width: 92,
  height: 92,
  marginRight: theme.spacing(2.8),
  objectFit: 'contain',
  borderRadius: 18,
  padding: theme.spacing(1.05),
  backgroundColor: '#ECF5EF',
  [theme.breakpoints.down('md')]: {
    width: 58,
    height: 58,
    marginRight: theme.spacing(1.4),
    borderRadius: 16,
    padding: theme.spacing(0.85),
  },
}));

export const ContentBox = styled(Box)({
  flex: 5,
  minWidth: 0,
});

export const NameText = styled(Typography)(({ theme }) => ({
  wordBreak: 'break-word',
  color: '#064326',
  fontSize: '1.72rem',
  lineHeight: 1.18,
  fontWeight: 900,
  letterSpacing: 0,
  [theme.breakpoints.down('md')]: {
    fontSize: '1.1rem',
  },
}));

export const DescriptionText = styled(Typography)(({ theme }) => ({
  wordBreak: 'break-word',
  color: '#5D6A62',
  fontSize: '1.02rem',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export const MetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1.2),
  marginTop: theme.spacing(1.3),
}));

export const MetaChip = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.55),
  minHeight: 36,
  padding: theme.spacing(0.65, 1.3),
  borderRadius: 8,
  backgroundColor: '#EAF4ED',
  color: '#064326',
  fontSize: '0.94rem',
  fontWeight: 800,
  '& .MuiSvgIcon-root': {
    width: 18,
    height: 18,
    color: '#157145',
    fontSize: '18px !important',
  },
  [theme.breakpoints.down('md')]: {
    minHeight: 28,
    fontSize: '0.78rem',
  },
}));

export const QuantityText = styled(Typography)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 82,
  minHeight: 38,
  padding: theme.spacing(0.6, 1.3),
  borderRadius: 8,
  backgroundColor: '#EAF4ED',
  color: '#064326',
  fontSize: '1rem',
  fontWeight: 900,
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('md')]: {
    minWidth: 64,
    minHeight: 32,
    fontSize: '0.85rem',
  },
}));
