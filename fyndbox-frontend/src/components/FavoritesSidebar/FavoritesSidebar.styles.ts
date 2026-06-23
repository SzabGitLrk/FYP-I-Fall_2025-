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
  minHeight: 72,
  padding: theme.spacing(1.5, 1.5),
  background:
    'linear-gradient(135deg, rgba(73, 139, 96, 0.98) 0%, rgba(93, 157, 113, 0.98) 48%, rgba(137, 183, 153, 0.98) 100%)',
  boxShadow: '0 12px 26px rgba(0, 35, 18, 0.18)',
  position: 'relative',
  zIndex: 1,
  '& .MuiIconButton-root': {
    width: 44,
    height: 44,
    borderRadius: '50%',
    color: theme.palette.common.white,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    border: '1px solid rgba(255, 255, 255, 0.28)',
    boxShadow: '0 8px 18px rgba(0, 35, 18, 0.16)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.24)',
    },
  },
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 950,
  color: theme.palette.common.white,
  fontSize: '1.05rem',
  letterSpacing: 0,
  textShadow: '0 12px 26px rgba(0, 35, 18, 0.32)',
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
  backgroundColor: theme.palette.common.white,
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

