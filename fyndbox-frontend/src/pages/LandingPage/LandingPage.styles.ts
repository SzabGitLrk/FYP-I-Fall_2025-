import { Box, Button, Container, IconButton, SvgIcon, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const HomeContainer = styled(Box)(() => ({
  minHeight: '100dvh',
  color: '#143225',
  fontFamily: '"Segoe UI", Arial, sans-serif',
  background: '#F6F8F6',
  overflowX: 'hidden',
  '& *': {
    boxSizing: 'border-box',
  },
}));

export const PageShell = styled(Container)(({ theme }) => ({
  width: '100%',
  maxWidth: '1500px !important',
  padding: theme.spacing(1.5, 2, 0),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2.2, 2.2, 2.2),
  },
  [theme.breakpoints.up('xl')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
}));

export const Navbar = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(1),
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(1.1, 1.2, 1.1, 1.6),
  border: '1px solid rgba(255, 255, 255, 0.74)',
  borderRadius: 999,
  backgroundColor: 'rgba(255, 255, 255, 0.76)',
  backdropFilter: 'blur(18px)',
  boxShadow: '0 18px 48px rgba(16, 66, 42, 0.12)',
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const BrandMark = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: '1.08rem',
}));

export const BrandIcon = styled('img')({
  width: 42,
  height: 42,
  objectFit: 'contain',
  flexShrink: 0,
});

export const NavLinks = styled(Box)(({ theme }) => ({
  display: 'none',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

export const NavLinkButton = styled(Button)(({ theme }) => ({
  color: '#315344',
  borderRadius: 999,
  padding: theme.spacing(0.9, 1.6),
  textTransform: 'none',
  fontWeight: 700,
  '&:hover': {
    backgroundColor: 'rgba(21, 113, 69, 0.08)',
    color: theme.palette.primary.dark,
    transform: 'translateY(-1px)',
  },
  transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
}));

export const NavLoginButton = styled(Button)(({ theme }) => ({
  display: 'none',
  borderRadius: 999,
  padding: theme.spacing(1, 2.4),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  textTransform: 'none',
  fontWeight: 800,
  boxShadow: '0 12px 28px rgba(21, 113, 69, 0.24)',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'translateY(-2px)',
    boxShadow: '0 16px 34px rgba(21, 113, 69, 0.3)',
  },
  transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  [theme.breakpoints.up('md')]: {
    display: 'inline-flex',
  },
}));

export const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.dark,
  backgroundColor: 'rgba(21, 113, 69, 0.08)',
  '&:hover': {
    backgroundColor: 'rgba(21, 113, 69, 0.14)',
  },
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const MobileMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>(({ theme, open }) => ({
  display: open ? 'grid' : 'none',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.2),
  padding: theme.spacing(1.2),
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.75)',
  boxShadow: '0 18px 42px rgba(16, 66, 42, 0.13)',
  backdropFilter: 'blur(16px)',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  '& .MuiButton-root': {
    justifyContent: 'flex-start',
    width: '100%',
  },
}));

export const HeroSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  alignItems: 'stretch',
  margin: 0,
  padding: theme.spacing(3),
  borderRadius: 30,
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid rgba(14, 54, 34, 0.04)',
  boxShadow: '0 22px 56px rgba(29, 54, 39, 0.17)',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 105% -18%, rgba(21, 113, 69, 0.32) 0 18%, transparent 18.2%), radial-gradient(circle at -6% 106%, rgba(21, 113, 69, 0.3) 0 20%, transparent 20.2%)',
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle, rgba(21, 113, 69, 0.18) 0 2px, transparent 2.4px)',
    backgroundSize: '16px 16px',
    backgroundPosition: '12px 12px',
    mask:
      'linear-gradient(#000 0 0) left 12px top 12px / 140px 112px no-repeat, linear-gradient(#000 0 0) right 390px bottom 48px / 88px 128px no-repeat',
    WebkitMask:
      'linear-gradient(#000 0 0) left 12px top 12px / 140px 112px no-repeat, linear-gradient(#000 0 0) right 390px bottom 48px / 88px 128px no-repeat',
    pointerEvents: 'none',
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
  [theme.breakpoints.up('lg')]: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(2rem, 3vw, 3.5rem)',
    minHeight: 'calc(100dvh - 56px)',
    padding: theme.spacing(9, 5, 7.5),
  },
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(2, 0, 4),
    padding: theme.spacing(3.2, 0, 0),
    borderRadius: 24,
    gap: theme.spacing(0),
    background:
      'linear-gradient(180deg, rgba(137, 183, 153, 0.98) 0, rgba(117, 166, 131, 0.98) 330px, transparent 330px)',
    border: 'none',
    boxShadow: 'none',
    '&::before': {
      background:
        'radial-gradient(circle at 18% 16%, rgba(255,255,255,0.18), transparent 28%), radial-gradient(circle at 82% 24%, rgba(255,255,255,0.14), transparent 24%)',
    },
    '&::after': {
      display: 'none',
    },
  },
}));

export const HeroContent = styled(Box)(({ theme }) => ({
  flex: '1 1 760px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  textAlign: 'left',
  gap: theme.spacing(2),
  [theme.breakpoints.up('lg')]: {
    flex: '0 1 min(52vw, 720px)',
  },
  [theme.breakpoints.down('sm')]: {
    order: 1,
    alignItems: 'center',
    gap: 0,
    '& > :not([data-mobile-visual="true"])': {
      display: 'none',
    },
  },
}));

export const MobileHeroBrand = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('sm')]: {
    order: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    color: theme.palette.common.white,
    fontWeight: 800,
    fontSize: '1.55rem',
    padding: theme.spacing(0, 0, 1.4),
    '& img': {
      width: 46,
      height: 46,
      objectFit: 'contain',
      filter: 'drop-shadow(0 10px 18px rgba(6, 57, 33, 0.2))',
    },
  },
}));

export const Eyebrow = styled(Typography)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.9),
  padding: theme.spacing(0.75, 1.25),
  borderRadius: 999,
  color: theme.palette.primary.main,
  backgroundColor: 'rgba(21, 113, 69, 0.11)',
  border: '1px solid rgba(21, 113, 69, 0.08)',
  fontWeight: 800,
  fontSize: '0.82rem',
  letterSpacing: 0,
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
  },
}));

export const HeroTitle = styled(Typography)(({ theme }) => ({
  maxWidth: 680,
  color: '#073A27',
  fontSize: 'clamp(3.15rem, 5.8vw, 5.05rem)',
  lineHeight: 0.96,
  fontWeight: 800,
  letterSpacing: 0,
  [theme.breakpoints.up('lg')]: {
    maxWidth: 760,
  },
}));

export const HeroDescription = styled(Typography)(() => ({
  maxWidth: 620,
  color: '#5E6573',
  fontSize: 'clamp(1rem, 1.2vw, 1.16rem)',
  lineHeight: 1.55,
  fontWeight: 500,
  letterSpacing: 0,
}));

export const FeatureList = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(1.2),
  width: '100%',
  maxWidth: 660,
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
}));

export const FeaturePill = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minHeight: 50,
  padding: theme.spacing(1, 1.25),
  borderRadius: 9,
  color: '#313D49',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(19, 50, 31, 0.08)',
  boxShadow: '0 10px 24px rgba(16, 66, 42, 0.1)',
  backdropFilter: 'blur(8px)',
  fontWeight: 800,
  transition: 'transform 180ms ease, box-shadow 180ms ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 16px 34px rgba(16, 66, 42, 0.14)',
  },
}));

export const FeatureIcon = styled(Box)(({ theme }) => ({
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  borderRadius: 7,
  color: theme.palette.common.white,
  background: 'linear-gradient(180deg, #1F9257 0%, #0B7643 100%)',
  boxShadow: '0 8px 16px rgba(16, 66, 42, 0.2)',
}));

export const IllustrationPanel = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 660,
  minHeight: 0,
  padding: theme.spacing(2),
  borderRadius: 20,
  background:
    'linear-gradient(180deg, rgba(250, 253, 251, 0.94) 0%, rgba(255, 255, 255, 0.98) 100%)',
  border: '1px solid rgba(21, 113, 69, 0.025)',
  boxShadow: 'inset 0 14px 30px rgba(16, 66, 42, 0.025)',
  backdropFilter: 'blur(8px)',
  [theme.breakpoints.up('lg')]: {
    maxWidth: 660,
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: 305,
    minHeight: 0,
    padding: 0,
    marginTop: theme.spacing(0.2),
    marginBottom: theme.spacing(1.7),
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    boxShadow: 'none',
    backdropFilter: 'none',
  },
}));

export const BoxesIllustration = styled(SvgIcon)(({ theme }) => ({
  width: '100%',
  height: 'auto',
  minHeight: 170,
  maxHeight: 275,
  overflow: 'visible',
  filter: 'drop-shadow(0 18px 22px rgba(20, 91, 54, 0.12))',
  '--box-primary-front': '#D49C58',
  '--box-primary-side': '#C88943',
  '--box-primary-top': '#F3C782',
  '--box-secondary-front': '#E2A85F',
  '--box-secondary-side': '#CB8E47',
  '--box-secondary-top': '#F6CD8E',
  '--box-stroke': '#7E5E32',
  [theme.breakpoints.down('sm')]: {
    minHeight: 178,
    maxHeight: 205,
    filter: 'none',
    '--box-primary-front': '#D49C58',
    '--box-primary-side': '#C88943',
    '--box-primary-top': '#F3C782',
    '--box-secondary-front': '#E2A85F',
    '--box-secondary-side': '#CB8E47',
    '--box-secondary-top': '#F6CD8E',
    '--box-stroke': '#7E5E32',
  },
}));

export const LoginColumn = styled(Box)(({ theme }) => ({
  flex: '0 0 clamp(455px, 31vw, 500px)',
  minWidth: 0,
  display: 'flex',
  justifyContent: 'center',
  [theme.breakpoints.up('lg')]: {
    justifyContent: 'flex-end',
  },
  [theme.breakpoints.down('sm')]: {
    order: 2,
    flex: 'none',
    width: '100%',
    padding: theme.spacing(0, 1.5),
  },
}));

export const LoginCard = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 495,
  padding: theme.spacing(3.5, 3),
  borderRadius: 23,
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  border: '1px solid rgba(19, 50, 31, 0.06)',
  boxShadow: '0 18px 46px rgba(35, 53, 43, 0.13)',
  backdropFilter: 'blur(16px)',
  textAlign: 'center',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4.3, 3.2),
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(4.6, 3.2, 3.6),
  },
  '& .MuiTypography-h1': {
    color: '#13291F',
    fontSize: 'clamp(1.65rem, 2.5vw, 2.03rem)',
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: 0,
    marginBottom: theme.spacing(1.25),
  },
  '& .MuiTypography-body1': {
    color: '#5E6573',
    fontSize: '0.95rem',
    lineHeight: 1.55,
    fontWeight: 500,
    letterSpacing: 0,
  },
  '& .mobile-copy': {
    display: 'none',
  },
  '& .MuiTypography-body2': {
    color: '#385548',
    fontSize: '0.88rem',
    lineHeight: 1.45,
  },
  '& a': {
    color: theme.palette.primary.main,
    fontWeight: 800,
  },
  '& .MuiButton-root': {
    width: '100%',
    minWidth: 0,
    minHeight: 52,
    borderRadius: 13,
    fontWeight: 800,
  },
  '& [class*="ButtonsGroupWrapper"]': {
    width: '100%',
    padding: theme.spacing(2.5, 0, 1.7),
    gap: theme.spacing(1.3),
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: 'none',
    padding: theme.spacing(2.4, 2.2, 2),
    borderRadius: 18,
    backgroundColor: theme.palette.common.white,
    boxShadow: '0 18px 42px rgba(16, 66, 42, 0.18)',
    '& .MuiTypography-h1': {
      fontSize: '1.65rem',
      lineHeight: 1.12,
      marginBottom: theme.spacing(1),
    },
    '& .MuiTypography-body1': {
      fontSize: '0.91rem',
      lineHeight: 1.34,
      color: '#1F2B25',
    },
    '& .desktop-copy': {
      display: 'none',
    },
    '& .mobile-copy': {
      display: 'block',
    },
    '& .MuiButton-root': {
      minHeight: 43,
      borderRadius: 22,
      fontSize: '0.9rem',
    },
    '& [class*="ButtonsGroupWrapper"]': {
      padding: theme.spacing(1.8, 0, 1.1),
      gap: theme.spacing(0.9),
    },
    '& [class*="LanguageSelectorWrapper"]': {
      padding: theme.spacing(1, 0, 0),
    },
  },
}));

export const LoginCardBrand = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(1.7),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const LoginCardLogo = styled('img')(({ theme }) => ({
  width: 96,
  height: 96,
  objectFit: 'contain',
  filter: 'drop-shadow(0 12px 20px rgba(21, 113, 69, 0.18))',
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const CardMeta = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.4),
  marginTop: theme.spacing(0.5),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.85),
    marginTop: 0,
    '& .MuiTypography-body2': {
      fontSize: '0.78rem',
      lineHeight: 1.35,
      color: '#111F18',
    },
  },
}));
