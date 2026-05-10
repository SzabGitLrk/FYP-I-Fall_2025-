import {
  BottomNavigation,
  BottomNavigationAction,
  styled,
} from '@mui/material';

export const FooterContainer = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  width: '100%',
  backgroundColor: theme.palette.common.white,
  boxShadow: '0px -1px 6px rgba(0, 0, 0, 0.1)',
  // Remove justifyContent center and fixed flex to allow buttons to spread out evenly.
  // We can add a maxWidth to prevent them from spreading too far on large screens.
  maxWidth: theme.breakpoints.values.lg,
  margin: '0 auto',
  borderTopLeftRadius: theme.shape.borderRadius * 2,
  borderTopRightRadius: theme.shape.borderRadius * 2,
  '& .MuiBottomNavigationAction-root': {
    minWidth: 72,
  },
}));

export const FooterActionButton = styled(BottomNavigationAction)(
  ({ theme }) => ({
    color: theme.palette.secondary.contrastText,
  }),
);
