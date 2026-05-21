import { Box, Button, Paper, Stack, Typography, styled } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const SmartAssistContent = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingTop: theme.spacing(5),
}));

export const SmartAssistActionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  justifyContent: 'center',
  flexWrap: 'wrap',
}));

/**
 * PRIMARY — Sage green filled pill.
 * Usage: Save, Confirm, Yes, Close (positive/main action).
 */
export const SmartAssistPrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '999px',
  minWidth: '10rem',
  padding: theme.spacing(1.25, 2.5),
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: '#fff',
  background:
    'linear-gradient(135deg, rgba(93, 157, 113, 0.95) 0%, rgba(73, 139, 96, 0.95) 100%)',
  boxShadow: '0 6px 20px rgba(73, 139, 96, 0.28)',
  transition:
    'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease',
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(73, 139, 96, 0.98) 0%, rgba(93, 157, 113, 0.98) 100%)',
    boxShadow: '0 8px 28px rgba(73, 139, 96, 0.36)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    background: theme.palette.grey[200],
    color: theme.palette.grey[500],
    boxShadow: 'none',
  },
}));

/**
 * SECONDARY — Light sage-green outlined pill.
 * Usage: Cancel, No, Dismiss, Close (neutral/dismiss action).
 */
export const SmartAssistSecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '999px',
  minWidth: '8.5rem',
  padding: theme.spacing(1.25, 2.5),
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '0.01em',
  borderColor: 'rgba(93, 157, 113, 0.35)',
  borderWidth: '1.5px',
  color: 'rgba(73, 139, 96, 0.9)',
  transition: 'all 200ms ease',
  '&:hover': {
    borderWidth: '1.5px',
    borderColor: 'rgba(73, 139, 96, 0.6)',
    backgroundColor: 'rgba(93, 157, 113, 0.06)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

/**
 * DESTRUCTIVE — Soft coral/red outlined pill.
 * Usage: Stop recording, Delete, destructive/interruptive actions.
 */
export const SmartAssistDestructiveButton = styled(Button)(({ theme }) => ({
  borderRadius: '999px',
  minWidth: '8.5rem',
  padding: theme.spacing(1.25, 2.5),
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '0.01em',
  borderColor: alpha(theme.palette.error.main, 0.45),
  borderWidth: '1.5px',
  color: theme.palette.error.main,
  transition: 'all 200ms ease',
  '&:hover': {
    borderWidth: '1.5px',
    borderColor: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.06),
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

export const SmartAssistSummaryCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'left',
  backgroundColor: 'rgba(93, 157, 113, 0.05)',
  borderLeft: '4px solid rgba(93, 157, 113, 0.6)',
  borderRadius: theme.spacing(1.5),
  whiteSpace: 'pre-line',
  boxShadow: 'none',
}));

export const SmartAssistSectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  color: theme.palette.secondary.contrastText,
  fontWeight: 600,
}));

export const SmartAssistList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
}));
