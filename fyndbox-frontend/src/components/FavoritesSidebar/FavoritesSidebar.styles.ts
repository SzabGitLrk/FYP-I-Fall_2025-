import { Box, Drawer, styled, SvgIcon, Typography } from '@mui/material';

export const FavoritesDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    display: 'flex',
    flexDirection: 'column',
    width: 'min(88vw, 360px)',
    maxWidth: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    border: 'none',
    boxShadow: '-18px 0 48px rgba(8, 38, 27, 0.22)',
    color: theme.palette.primary.dark,
    backgroundColor: theme.palette.common.white,
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDrawer-paper': {
      width: '86vw',
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
    },
  },
}));

export const FavoritesHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '48px 1fr 48px',
  alignItems: 'center',
  minHeight: 64,
  padding: theme.spacing(1, 1.25),
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  boxShadow: '0 5px 16px rgba(20, 54, 39, 0.08)',
  position: 'relative',
  zIndex: 1,
  '& .MuiIconButton-root': {
    color: theme.palette.primary.dark,
  },
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 700,
  color: theme.palette.primary.dark,
  fontSize: '1.05rem',
}));

export const HeaderSpacer = styled(Box)({
  width: 48,
  height: 48,
});

export const FavoritesList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  overflowY: 'auto',
  backgroundColor: '#F6FAF7',
}));

export const EmptyState = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: theme.spacing(4, 3),
}));

export const EmptyStateIllustration = styled(SvgIcon)(({ theme }) => ({
  width: 168,
  height: 168,
  marginBottom: theme.spacing(2),
  overflow: 'visible',
}));

export const EmptyStateTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontWeight: 700,
  lineHeight: 1.25,
  marginBottom: theme.spacing(0.75),
}));

export const EmptyStateDescription = styled(Typography)({
  color: '#4E6359',
  fontWeight: 400,
  lineHeight: 1.5,
});
