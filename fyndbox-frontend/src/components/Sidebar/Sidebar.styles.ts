import { Avatar, Box, Drawer, styled } from '@mui/material';
import { BaseButton } from '../../styles/commonStyles';

/* ── Drawer paper ───────────────────────────────────────────── */
export const SidebarDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 'min(88vw, 360px)',
    maxWidth: '100%',
    overflow: 'hidden',
    border: 'none',
    boxShadow: '18px 0 48px rgba(8, 38, 27, 0.22)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F6FAF7',
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDrawer-paper': {
      width: '86vw',
    },
  },
}));

/* ── Header / profile banner ────────────────────────────────── */
export const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3, 2.5, 2.5),
  background: 'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
  },
}));

export const AvatarContainer = styled(Avatar)(({ theme }) => ({
  width: 58,
  height: 58,
  fontSize: '1.3rem',
  fontWeight: 700,
  backgroundColor: theme.palette.common.white,
  border: '3px solid rgba(255,255,255,0.7)',
  color: theme.palette.primary.main,
  boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
  zIndex: 1,
}));

/* ── Scrollable body ────────────────────────────────────────── */
export const SidebarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: theme.spacing(2, 2.5),
  overflowY: 'auto',
}));

export const SidebarElementContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

/* ── Menu row ───────────────────────────────────────────────── */
export const LinkElement = styled(Box)(({ theme }) => ({
  borderRadius: 16,
  backgroundColor: theme.palette.common.white,
  boxShadow: '0 2px 10px rgba(20, 54, 39, 0.07)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(20, 54, 39, 0.13)',
    transform: 'translateX(4px)',
  },
}));

export const IconButtonContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
}));

export const MenuIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 42,
  height: 42,
  borderRadius: 12,
  backgroundColor: '#E9F5EE',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: '1.4rem',
    color: theme.palette.primary.main,
  },
}));

export const LinkButton = styled(BaseButton)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  padding: theme.spacing(2.2, 2.5),
  textTransform: 'none',
  color: theme.palette.primary.dark,
  minWidth: 'unset',
  borderRadius: 16,
  fontWeight: 600,
  '& > .MuiSvgIcon-root': {
    color: theme.palette.grey[400],
    fontSize: '1.35rem',
  },
}));

/* ── Action buttons ─────────────────────────────────────────── */
export const DeactivateButton = styled(BaseButton)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  minWidth: 'unset',
  width: '100%',
  borderRadius: 14,
  fontWeight: 700,
  fontSize: '0.92rem',
  padding: theme.spacing(1.4, 0),
  boxShadow: '0 6px 18px rgba(175, 87, 87, 0.22)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
    boxShadow: '0 8px 22px rgba(175, 87, 87, 0.30)',
  },
}));

export const LogoutButton = styled(BaseButton)(({ theme }) => ({
  color: theme.palette.primary.dark,
  minWidth: 'unset',
  width: '100%',
  borderRadius: 14,
  fontWeight: 700,
  fontSize: '0.92rem',
  padding: theme.spacing(1.4, 0),
  border: `1.5px solid ${theme.palette.primary.main}`,
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(21, 113, 69, 0.06)',
    borderColor: theme.palette.primary.dark,
  },
}));
