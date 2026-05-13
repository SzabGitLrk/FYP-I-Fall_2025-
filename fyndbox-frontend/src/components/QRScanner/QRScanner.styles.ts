import { Box, Button, styled } from '@mui/material';

export const QrOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: theme.zIndex.modal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(15, 23, 42, 0.62)',
  backdropFilter: 'blur(4px)',
}));

export const QrContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  width: 'min(92vw, 520px)',
  maxHeight: 'min(90vh, 760px)',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)',
}));

export const QrReaderContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '400px',
  aspectRatio: '1',
  border: `2px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
}));

export const ButtonContainer = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
}));
