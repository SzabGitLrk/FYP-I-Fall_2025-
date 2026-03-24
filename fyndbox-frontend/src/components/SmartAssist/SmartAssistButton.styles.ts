import { Fab, styled } from '@mui/material';

export const StyledSmartAssistButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  right: theme.spacing(2.5),
  bottom: `calc(${theme.spacing(11)} + env(safe-area-inset-bottom, 0px))`,
  zIndex: 1200,

  width: 60,
  height: 60,

  backgroundColor: theme.palette.common.white,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[6],

  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },

  '&.Mui-disabled': {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[500],
    borderColor: theme.palette.grey[300],
  },
}));
