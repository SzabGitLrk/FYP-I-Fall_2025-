import { Box, Button, styled } from '@mui/material';
import { keyframes } from '@emotion/react';

export const QrOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: theme.zIndex.modal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
}));

export const QrContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  width: 'min(92vw, 520px)',
  maxHeight: 'min(90vh, 760px)',
  borderRadius: 20,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)',
  overflow: 'hidden',
}));

/* ── Header ─────────────────────────────────────────────── */
export const QrHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  minHeight: 56,
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, rgba(21, 113, 69, 0.92) 100%)`,
  boxShadow: '0 4px 12px rgba(21, 113, 69, 0.16)',
}));

export const QrHeaderTitle = styled('h2')(({ theme }) => ({
  margin: 0,
  color: theme.palette.common.white,
  fontSize: '1.1rem',
  fontWeight: 700,
  letterSpacing: 0.3,
}));

export const QrCloseButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  minWidth: 'unset',
  width: 36,
  height: 36,
  padding: 0,
  borderRadius: '50%',
  color: theme.palette.common.white,
  backgroundColor: 'rgba(255, 255, 255, 0.16)',
  border: '1px solid rgba(255, 255, 255, 0.28)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.4rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
}));

/* ── Body content ───────────────────────────────────────────────── */
export const QrBodyContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(2.5, 3, 2.5),
  flex: 1,
}));

export const QrReaderContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  maxWidth: '400px',
  aspectRatio: '1',
  backgroundColor: '#000',
  borderRadius: 16,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& video': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

/* ── Scanning overlay frame ─────────────────────────────────────── */
const scanningAnimation = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0.6;
  }
`;

export const QrScanningOverlay = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
}));

export const QrScanningFrame = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '20%',
    border: '2px solid rgba(21, 113, 69, 0.3)',
    borderRadius: 12,
  },
}));

export const QrCornerBracket = styled(Box)(() => ({
  position: 'absolute',
  width: 28,
  height: 28,
  '&.top-left': {
    top: '20%',
    left: '20%',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: 3,
      backgroundColor: '#15A34A',
      top: 0,
      left: 0,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: 3,
      height: '100%',
      backgroundColor: '#15A34A',
      top: 0,
      left: 0,
    },
  },
  '&.top-right': {
    top: '20%',
    right: '20%',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: 3,
      backgroundColor: '#15A34A',
      top: 0,
      right: 0,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: 3,
      height: '100%',
      backgroundColor: '#15A34A',
      top: 0,
      right: 0,
    },
  },
  '&.bottom-left': {
    bottom: '20%',
    left: '20%',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: 3,
      backgroundColor: '#15A34A',
      bottom: 0,
      left: 0,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: 3,
      height: '100%',
      backgroundColor: '#15A34A',
      bottom: 0,
      left: 0,
    },
  },
  '&.bottom-right': {
    bottom: '20%',
    right: '20%',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: 3,
      backgroundColor: '#15A34A',
      bottom: 0,
      right: 0,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: 3,
      height: '100%',
      backgroundColor: '#15A34A',
      bottom: 0,
      right: 0,
    },
  },
}));

export const QrScanningLine = styled(Box)(() => ({
  position: 'absolute',
  left: '20%',
  right: '20%',
  height: 3,
  backgroundColor: '#15A34A',
  boxShadow: '0 0 12px rgba(21, 163, 74, 0.9)',
  animation: `${scanningAnimation} 2s ease-in-out infinite`,
  top: '20%',
}));

/* ── Instruction text ───────────────────────────────────────────– */
export const QrInstructionText = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: 0,
  fontSize: '0.88rem',
  fontWeight: 500,
  color: '#66756C',
  lineHeight: 1.4,
}));

/* ── Error message ──────────────────────────────────────────────– */
export const QrErrorMessage = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontSize: '0.85rem',
  fontWeight: 500,
  color: theme.palette.error.main,
  lineHeight: 1.4,
}));
