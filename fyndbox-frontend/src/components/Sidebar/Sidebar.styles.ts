import { Avatar, Box, Drawer, styled, Typography } from '@mui/material';
import { BaseButton } from '../../styles/commonStyles';

/* ── Drawer paper ───────────────────────────────────────────── */
export const SidebarDrawer = styled(Drawer)(({ theme }) => ({
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

/* ── Header / profile banner ────────────────────────────────── */
export const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '48px 1fr 48px',
  alignItems: 'center',
  minHeight: 92,
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

export const AvatarContainer = styled(Avatar)(({ theme }) => ({
  width: 78,
  height: 78,
  fontSize: '1.65rem',
  fontWeight: 900,
  backgroundColor: theme.palette.primary.main,
  border: '4px solid #CFF1DE',
  color: theme.palette.common.white,
  boxShadow: '0 16px 30px rgba(21, 113, 69, 0.18)',
  objectFit: 'cover',
}));

/* ── Scrollable body ────────────────────────────────────────── */
export const SidebarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  backgroundColor: theme.palette.common.white,
}));

export const ProfileBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(2.4, 1.5, 2.2),
  marginBottom: theme.spacing(2),
  borderBottom: '1px solid rgba(5, 63, 37, 0.1)',
}));

export const ProfileName = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1.25),
  color: '#063F25',
  fontSize: '1.12rem',
  fontWeight: 900,
  lineHeight: 1.2,
  letterSpacing: 0,
}));

export const ProfileEmail = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.45),
  color: '#66756C',
  fontSize: '0.82rem',
  fontWeight: 600,
  lineHeight: 1.4,
  wordBreak: 'break-word',
}));
export const SidebarElementContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

/* ── Menu row ───────────────────────────────────────────────── */
export const LinkElement = styled(Box)(({ theme }) => ({
  borderRadius: 12,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F4FBF6 100%)',
  border: '1px solid rgba(21, 113, 69, 0.18)',
  borderLeft: `6px solid ${theme.palette.primary.main}`,
  boxShadow: '0 8px 24px rgba(15, 57, 39, 0.08)',
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
  borderRadius: 12,
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
  borderRadius: 12,
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
  borderRadius: 12,
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

