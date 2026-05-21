import { Fab, styled } from '@mui/material';

interface StyledSmartAssistButtonProps {
  $placement?: 'floating' | 'inline';
}

export const StyledSmartAssistButton = styled(Fab, {
  shouldForwardProp: (prop) => prop !== '$placement',
})<StyledSmartAssistButtonProps>(({ theme, $placement = 'floating' }) => ({
  position: $placement === 'floating' ? 'fixed' : 'relative',
  right: $placement === 'floating' ? theme.spacing(2.5) : 'auto',
  bottom:
    $placement === 'floating'
      ? `calc(${theme.spacing(2.8)} + env(safe-area-inset-bottom, 0px))`
      : 'auto',
  zIndex: $placement === 'floating' ? 1200 : 0,

  width: 62,
  height: 62,

  background:
    $placement === 'inline'
      ? theme.palette.secondary.contrastText
      : 'linear-gradient(135deg, rgba(93, 157, 113, 0.98) 0%, rgba(73, 139, 96, 0.98) 50%, rgba(58, 125, 82, 0.98) 100%)',
  color:
    $placement === 'inline'
      ? theme.palette.secondary.main
      : theme.palette.common.white,
  border:
    $placement === 'inline'
      ? 'none'
      : '2px solid rgba(255, 255, 255, 0.20)',
  boxShadow:
    $placement === 'inline'
      ? '0 4px 12px rgba(0, 0, 0, 0.12)'
      : '0 14px 32px rgba(73, 139, 96, 0.32), 0 4px 12px rgba(73, 139, 96, 0.16)',

  overflow: 'hidden',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background:
      'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.12) 60deg, transparent 120deg)',
    animation:
      $placement === 'floating'
        ? 'smartButtonShimmer 4s ease-in-out infinite'
        : 'none',
    pointerEvents: 'none',
  },

  '@keyframes smartButtonShimmer': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },

  '@keyframes smartButtonPulseRing': {
    '0%': {
      boxShadow:
        '0 14px 32px rgba(73, 139, 96, 0.32), 0 4px 12px rgba(73, 139, 96, 0.16), 0 0 0 0 rgba(93, 157, 113, 0.28)',
    },
    '50%': {
      boxShadow:
        '0 14px 32px rgba(73, 139, 96, 0.32), 0 4px 12px rgba(73, 139, 96, 0.16), 0 0 0 8px rgba(93, 157, 113, 0)',
    },
    '100%': {
      boxShadow:
        '0 14px 32px rgba(73, 139, 96, 0.32), 0 4px 12px rgba(73, 139, 96, 0.16), 0 0 0 0 rgba(93, 157, 113, 0.28)',
    },
  },

  animation:
    $placement === 'floating'
      ? 'smartButtonPulseRing 3s ease-in-out infinite'
      : 'none',

  transition:
    'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease',

  '&:hover': {
    transform: 'scale(1.08)',
    backgroundColor:
      $placement === 'inline'
        ? theme.palette.grey[700]
        : theme.palette.primary.dark,
    boxShadow:
      '0 18px 40px rgba(73, 139, 96, 0.38), 0 6px 16px rgba(73, 139, 96, 0.20)',
  },

  '&:active': {
    transform: 'scale(0.96)',
  },

  '&.Mui-disabled': {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[500],
    borderColor: theme.palette.grey[300],
    animation: 'none',
    '&::before': {
      animation: 'none',
    },
  },
  [theme.breakpoints.down('md')]: {
    right: $placement === 'floating' ? '50%' : 'auto',
    bottom:
      $placement === 'floating'
        ? `calc(${theme.spacing(7.6)} + env(safe-area-inset-bottom, 0px))`
        : 'auto',
    transform: $placement === 'floating' ? 'translateX(50%)' : 'none',
    width: 64,
    height: 64,
    zIndex: 1300,
  },
}));
