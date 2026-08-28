import { Box, Fab, styled, Typography } from '@mui/material';

export const FooterContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  width: '100vw',
  height: `calc(70px + env(safe-area-inset-bottom, 0px))`,
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  backgroundColor: theme.palette.common.white,
  boxShadow: '0 -2px 8px rgba(23, 42, 31, 0.08)',
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  zIndex: 10,
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  overflow: 'visible',
  gap: 0,
  paddingTop: 8,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const FooterItem = styled(Box, {
  shouldForwardProp: (prop) => !['isLogout'].includes(prop as string),
})<{ isLogout?: boolean }>(
  ({ theme, isLogout }) => ({
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 4px',
    minWidth: 0,
    position: 'relative',
    overflow: 'visible',

    '& .MuiSvgIcon-root': {
      fontSize: '1.35rem',
      color: isLogout ? theme.palette.error.main : theme.palette.primary.dark,
      transition: 'color 0.2s ease',
    },

    '&:hover': {
      backgroundColor: 'rgba(21, 113, 69, 0.04)',

      '& .MuiSvgIcon-root': {
        color: isLogout ? theme.palette.error.dark : theme.palette.primary.main,
      },
    },

    '&:active': {
      backgroundColor: 'rgba(21, 113, 69, 0.08)',
    },
  }),
);

export const FooterItemLabel = styled(Typography, {
  shouldForwardProp: (prop) => !['isLogout'].includes(prop as string),
})<{ isLogout?: boolean }>(
  ({ theme, isLogout }) => ({
    fontSize: '10px',
    fontWeight: 500,
    color: isLogout ? theme.palette.error.main : theme.palette.primary.dark,
    transition: 'color 0.2s ease',
    textAlign: 'center',
    lineHeight: 1.2,
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  }),
);

export const FooterFabSpacer = styled(Box)(({ theme }) => ({
  flex: 0.6,
  height: '100%',
  pointerEvents: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const FooterFabButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: `calc(70px - 28px + env(safe-area-inset-bottom, 0px))`,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 56,
  height: 56,
  zIndex: 100,
  background: 'linear-gradient(180deg, #198D54 0%, #0B6C3B 100%)',
  color: theme.palette.common.white,
  boxShadow: '0 12px 28px rgba(8, 91, 48, 0.32)',
  border: 'none',
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',

  '&:hover': {
    background: 'linear-gradient(180deg, #118448 0%, #066B39 100%)',
    boxShadow: '0 14px 32px rgba(8, 91, 48, 0.38)',
  },

  '&:active': {
    boxShadow: '0 8px 20px rgba(8, 91, 48, 0.28)',
  },

  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: theme.palette.common.white,
  },

  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));
