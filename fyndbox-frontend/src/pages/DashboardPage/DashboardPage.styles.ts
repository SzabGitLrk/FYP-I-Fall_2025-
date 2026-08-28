import { Box, Container, styled } from '@mui/material';

export const DashboardContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  padding: 0,
  minHeight: '100dvh',
  display: 'flex',
  maxWidth: 'none !important',
  overflow: 'hidden',
  background: '#FBFDFB',
  color: '#063F25',
  fontFamily: '"Segoe UI", Arial, sans-serif',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 0,
  },
  '&::before': {
    width: 118,
    height: 96,
    right: 78,
    top: 6,
    opacity: 0.35,
    background:
      'radial-gradient(circle, rgba(255,255,255,0.6) 0 3px, transparent 3.4px)',
    backgroundSize: '18px 18px',
  },
  '&::after': {
    display: 'none',
  },
  [theme.breakpoints.down('md')]: {
    display: 'block',
    overflowX: 'hidden',
    background: '#FFFFFF',
    '&::before': {
      width: '100%',
      height: 330,
      top: 0,
      right: 0,
      borderBottomLeftRadius: '0',
      background:
        'linear-gradient(145deg, rgba(28, 126, 76, 0.98) 0%, rgba(4, 90, 48, 0.98) 68%, rgba(3, 78, 42, 0.98) 100%)',
    },
    '&::after': {
      left: '-18%',
      right: '-18%',
      bottom: 'auto',
      top: 244,
      width: '136%',
      height: 150,
      borderTopRightRadius: '50% 100%',
      borderTopLeftRadius: '50% 100%',
      background: '#FFFFFF',
      boxShadow: '0 -18px 34px rgba(255, 255, 255, 0.7)',
    },
  },
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: theme.spacing(1.6),
  width: '100%',
  maxWidth: 1160,
  margin: '0 auto',
  padding: theme.spacing(0, 5.2),
  paddingTop: theme.spacing(0.7),
  paddingBottom: theme.spacing(11),
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(21, 113, 69, 0.45) rgba(5, 63, 37, 0.08)',
  '&::-webkit-scrollbar': {
    width: 10,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(5, 63, 37, 0.06)',
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(21, 113, 69, 0.38)',
    borderRadius: 999,
    border: '2px solid rgba(251, 253, 251, 0.9)',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(21, 113, 69, 0.58)',
  },
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(1.9),
    maxWidth: 'none',
    margin: 0,
    padding: theme.spacing(2.2, 1.8),
    paddingTop: theme.spacing(2.8),
    paddingBottom: `calc(${theme.spacing(13.5)} + env(safe-area-inset-bottom, 0px))`,
    overflowY: 'visible',
  },
}));

export const DashboardRail = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 1200,
  width: $collapsed ? 64 : 318,
  height: 'calc(100vh - 20px)',
  margin: theme.spacing(1.25, 0, 1.25, 1.25),
  padding: theme.spacing($collapsed ? 0.8 : 2.7, $collapsed ? 0.8 : 2.5, $collapsed ? 0.8 : 2.4),
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(5, 63, 37, 0.06)',
  borderRadius: 24,
  boxShadow: '18px 0 38px rgba(16, 48, 32, 0.08)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing($collapsed ? 0.8 : 2.7),
  transition: 'width 220ms ease, padding 220ms ease, border-radius 220ms ease',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));
export const RailHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  display: 'flex',
  flexDirection: $collapsed ? 'column' : 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0,
}));

export const BrandLockup = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: $collapsed ? 'center' : 'flex-start',
  gap: theme.spacing(1.2),
  minWidth: 0,
  flex: $collapsed ? 0 : 1,
  color: '#157145',
  fontSize: '1.62rem',
  fontWeight: 800,
  width: $collapsed ? 40 : 'auto',
  height: $collapsed ? 40 : 'auto',
  '& img': {
    width: $collapsed ? 40 : 62,
    height: $collapsed ? 40 : 62,
    objectFit: 'contain',
    borderRadius: '50%',
    filter: 'drop-shadow(0 8px 12px rgba(9, 67, 36, 0.15))',
    flexShrink: 0,
  },
  '& span': {
    display: $collapsed ? 'none' : 'inline',
    fontSize: '1.65rem',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    whiteSpace: 'nowrap',
  },
}));

export const RailToggleButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  width: $collapsed ? 40 : 44,
  height: $collapsed ? 40 : 44,
  flex: $collapsed ? '0 0 40px' : '0 0 44px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 12,
  color: '#07512F',
  backgroundColor: '#F3FAF6',
  border: '1px solid rgba(21, 113, 69, 0.2)',
  boxShadow: '0 8px 18px rgba(16, 48, 32, 0.08)',
  cursor: 'pointer',
  transition: 'background-color 180ms ease, transform 180ms ease',
  '&:hover': {
    backgroundColor: 'rgba(214, 229, 216, 0.82)',
    transform: 'translateY(-1px)',
  },
  '& .MuiSvgIcon-root': {
    width: $collapsed ? 20 : 25,
    height: $collapsed ? 20 : 25,
  },
}));


export const RailProfileCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(1.1),
  padding: $collapsed ? theme.spacing(0.5, 0) : theme.spacing(1.1, 0, 1.5),
  borderBottom: $collapsed ? 'none' : '1px solid rgba(5, 63, 37, 0.1)',
}));

export const RailAvatar = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  position: 'relative',
  width: $collapsed ? 48 : 94,
  height: $collapsed ? 48 : 94,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  color: '#157145',
  background: 'linear-gradient(180deg, #E6F7EE 0%, #D7F1E4 100%)',
  border: $collapsed ? '3px solid #CFF1DE' : '6px solid #CFF1DE',
  boxShadow: '0 16px 30px rgba(21, 113, 69, 0.18)',
  fontSize: $collapsed ? '1rem' : '1.8rem',
  fontWeight: 900,
  overflow: 'visible',
  '& > span': {
    display: 'grid',
    placeItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    lineHeight: 1,
  },
  '& img': {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
    overflow: 'hidden',
    fontSize: 0,
    color: 'transparent',
  },
  [theme.breakpoints.down('lg')]: {
    width: $collapsed ? 48 : 86,
    height: $collapsed ? 48 : 86,
  },
}));

export const RailProfileStatus = styled(Box)(() => ({
  position: 'absolute',
  right: 1,
  bottom: 2,
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: '#1CCD73',
  border: '4px solid #FFFFFF',
  boxShadow: '0 4px 10px rgba(16, 48, 32, 0.12)',
}));

export const RailProfileText = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ $collapsed = false }) => ({
  display: $collapsed ? 'none' : 'block',
  minWidth: 0,
  textAlign: 'center',
  '& strong': {
    display: 'block',
    color: '#063F25',
    fontSize: '1.24rem',
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: 0,
  },
  '& span': {
    display: 'block',
    marginTop: 6,
    color: '#66756C',
    fontSize: '0.9rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));
export const RailNav = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: theme.spacing(2.3),
  padding: theme.spacing(0.6, 0, 1.6),
}));

export const RailNavGroup = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.55),
}));

export const RailSectionLabel = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  display: $collapsed ? 'none' : 'block',
  margin: theme.spacing(0.9, 0, -0.3),
  padding: theme.spacing(0, 2.3),
  color: '#8AA097',
  fontSize: '0.78rem',
  fontWeight: 900,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}));
export const RailNavItem = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== '$active' && prop !== '$collapsed' && prop !== '$danger',
})<{ $active?: boolean; $collapsed?: boolean; $danger?: boolean }>(
  ({ theme, $active = false, $collapsed = false, $danger = false }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: $collapsed ? 'center' : 'flex-start',
    gap: $collapsed ? 0 : theme.spacing(2),
    minHeight: $danger ? 64 : 60,
    padding: theme.spacing($danger ? 2 : 1.8, $collapsed ? 0 : 2.4),
    borderRadius: $danger ? 16 : 12,
    borderLeft: $active ? '4px solid #157145' : '4px solid transparent',
    color: $danger ? '#A32D2D' : $active ? '#063F25' : '#101915',
    background: $danger
      ? 'rgba(252, 235, 235, 0.82)'
      : $active
        ? 'linear-gradient(90deg, rgba(214, 244, 226, 0.98), rgba(229, 248, 238, 0.90))'
        : 'transparent',
    boxShadow: $active ? '0 16px 28px rgba(21, 113, 69, 0.14)' : 'none',
    fontSize: '1rem',
    fontWeight: $active || $danger ? 900 : 750,
    cursor: 'pointer',
    transition:
      'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
    '&:hover': {
      backgroundColor: $danger
        ? '#FCEBEB'
        : $active
          ? 'rgba(214, 229, 216, 0.84)'
          : 'rgba(224, 235, 227, 0.62)',
    },
    '& .MuiSvgIcon-root': {
      width: 30,
      height: 30,
      color: $danger ? '#A32D2D' : '#07512F',
      strokeWidth: 2.45,
    },
    '& span': {
      display: $collapsed ? 'none' : 'inline',
    },
  })
);

export const RailFooter = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$collapsed',
})<{ $collapsed?: boolean }>(({ theme, $collapsed = false }) => ({
  marginTop: 'auto',
  paddingTop: theme.spacing(2.4),
  borderTop: 'none',
  display: 'grid',
  gap: theme.spacing(1.2),
  justifyItems: $collapsed ? 'center' : 'stretch',
}));

export const DashboardWorkspace = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$sidebarCollapsed',
})<{ $sidebarCollapsed?: boolean }>(({ theme, $sidebarCollapsed = false }) => ({
  position: 'relative',
  zIndex: 1,
  flex: '1 1 auto',
  minWidth: 0,
  height: '100dvh',
  padding: 0,
  marginLeft: $sidebarCollapsed ? 100 : 330,
  width: `calc(100% - ${$sidebarCollapsed ? 100 : 330}px)`,
  transition: 'margin-left 220ms ease',
  [theme.breakpoints.down('lg')]: {
    padding: 0,
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    width: '100%',
    padding: 0,
  },
}));

export const DashboardContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 'none',
  margin: '0 auto',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    maxWidth: 'none',
    minHeight: '100dvh',
    height: 'auto',
    overflow: 'visible',
    overflowY: 'visible',
    '& > span': {
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      overflow: 'hidden',
      lineHeight: 1,
    },
  },
}));

export const SubContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.4),
  margin: theme.spacing(-0.5, 0, 1.4, 4.5),
  maxHeight: '500px',
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingRight: theme.spacing(0.5),
  /* Custom Scrollbar Styling */
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(21, 113, 69, 0.4) transparent',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(21, 113, 69, 0.4)',
    borderRadius: '4px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
    '&:hover': {
      backgroundColor: 'rgba(21, 113, 69, 0.6)',
    },
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(1.7),
    maxHeight: '400px',
  },
}));

export const PrimaryActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  margin: theme.spacing(1.3, 0, 0),
  [theme.breakpoints.down('md')]: {
    margin: theme.spacing(2.5, 0, 2),
    gap: theme.spacing(1.5),
  },
}));

