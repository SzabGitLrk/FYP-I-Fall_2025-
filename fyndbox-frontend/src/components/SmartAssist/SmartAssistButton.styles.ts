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

  width: 64,
  height: 64,
  minHeight: 64,

  background:
    $placement === 'inline'
      ? theme.palette.secondary.contrastText
      : 'linear-gradient(135deg, rgba(18, 128, 75, 0.98) 0%, rgba(7, 81, 47, 0.98) 100%)',
  color:
    $placement === 'inline'
      ? theme.palette.secondary.main
      : theme.palette.common.white,
  border:
    $placement === 'inline'
      ? 'none'
      : '2px solid rgba(255, 255, 255, 0.34)',
  boxShadow:
    $placement === 'inline'
      ? '0 4px 12px rgba(0, 0, 0, 0.12)'
      : '0 16px 34px rgba(7, 81, 47, 0.30), 0 5px 14px rgba(7, 81, 47, 0.18)',

  '& .MuiSvgIcon-root': {
    width: 36,
    height: 36,
    strokeWidth: 2.8,
  },

  transition:
    'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease, background-color 200ms ease',

  '&:hover': {
    transform: 'translateY(-2px) scale(1.04)',
    backgroundColor:
      $placement === 'inline'
        ? theme.palette.grey[700]
        : theme.palette.primary.dark,
    boxShadow:
      '0 20px 44px rgba(7, 81, 47, 0.36), 0 7px 18px rgba(7, 81, 47, 0.22)',
  },

  '&:active': {
    transform: 'scale(0.96)',
  },

  '&.Mui-disabled': {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[500],
    borderColor: theme.palette.grey[300],
    boxShadow: 'none',
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
    '&:hover': {
      transform: $placement === 'floating' ? 'translateX(50%) scale(1.04)' : 'scale(1.04)',
    },
  },
}));
