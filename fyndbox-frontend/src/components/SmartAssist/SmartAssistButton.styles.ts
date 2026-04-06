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
      ? `calc(${theme.spacing(11)} + env(safe-area-inset-bottom, 0px))`
      : 'auto',
  zIndex: $placement === 'floating' ? 1200 : 0,

  width: 60,
  height: 60,

  backgroundColor:
    $placement === 'inline'
      ? theme.palette.secondary.contrastText
      : theme.palette.common.white,
  color:
    $placement === 'inline'
      ? theme.palette.secondary.main
      : theme.palette.primary.main,
  border:
    $placement === 'inline'
      ? 'none'
      : `1px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[6],

  '&:hover': {
    backgroundColor:
      $placement === 'inline'
        ? theme.palette.grey[700]
        : theme.palette.grey[100],
  },

  '&.Mui-disabled': {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[500],
    borderColor: theme.palette.grey[300],
  },
}));
