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
  height: `calc(82px + env(safe-area-inset-bottom, 0px))`,
  padding: `0 ${theme.spacing(0.5)} env(safe-area-inset-bottom, 0px)`,
  boxShadow: '0 -12px 28px rgba(23, 42, 31, 0.12)',
  maxWidth: 430,
  margin: '0 auto',
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  '& .MuiBottomNavigationAction-root': {
    minWidth: 66,
    paddingTop: theme.spacing(1),
    color: '#064326',
  },
  '& .MuiBottomNavigationAction-label': {
    marginTop: theme.spacing(0.3),
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.7rem',
  },
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const FooterActionButton = styled(BottomNavigationAction)(
  ({ theme }) => ({
    color: theme.palette.primary.dark,
  }),
);
