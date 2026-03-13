import { Box, Button, styled } from '@mui/material';

export const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  margin: theme.spacing(6, 0),
  paddingBottom: theme.spacing(2),
}));

export const CapsuleButton = styled(Button)(({ theme }) => ({
  borderRadius: '50px',
  padding: theme.spacing(1.5, 4),
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: '180px',
  height: '56px',
  whiteSpace: 'nowrap',
}));

export const AddStorageButton = styled(CapsuleButton)(() => ({
  backgroundColor: '#000000',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#333333',
  },
}));

export const SmartAddButton = styled(CapsuleButton)(() => ({
  backgroundColor: '#ffffff',
  color: '#000000',
  border: '1px solid #000000',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

export const SaveButton = styled(Button)(({ theme }) => ({
  borderRadius: '28px',
  padding: theme.spacing(1.25, 2),
  textTransform: 'none',
  minWidth: '20rem',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));
