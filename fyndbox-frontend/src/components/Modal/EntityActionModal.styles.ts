import { Box, Button, IconButton, styled, Typography } from '@mui/material';

export const ModalContainer = styled(Box)(({}) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1300,
}));

export const ModalBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  height: 'auto',
  borderRadius: '16px',
  padding: theme.spacing(2),
  textAlign: 'center',
  maxHeight: '90vh',
  overflowY: 'auto',
}));

export const CancelButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '50%',
  cursor: 'pointer',
  justifyContent: 'center',
  color: theme.palette.secondary.contrastText,
  width: '40px',
  height: '40px',
  top: theme.spacing(1.25),
  right: theme.spacing(1.25),
}));

export const ImageUploaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

export const ImageLabel = styled(Typography)(({ theme }) => ({
  paddingRight: theme.spacing(4),
  textAlign: 'center',
}));

export const ImageBox = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  marginRight: theme.spacing(2),
  objectFit: 'cover',
}));

export const ClearButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(0.1),
  color: theme.palette.error.main,
}));

export const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  marginTop: theme.spacing(2),
}));

export const QuantityLabel = styled(Typography)(({ theme }) => ({
  marginRight: theme.spacing(2),
  flex: 1,
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  border: '1px solid #000000',
  borderRadius: theme.spacing(1),
  marginLeft: 'auto',
}));

export const QuantityCounter = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(0, 2),
  minWidth: '20px',
  textAlign: 'center',
}));

export const StepperButton = styled(Button)(({ theme }) => ({
  minWidth: '60px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontSize: theme.spacing(3),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  borderRadius: 0,
}));

export const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2, 0),
  position: 'sticky',
  bottom: 0,
  backgroundColor: theme.palette.secondary.main,
  zIndex: 10,
  justifyContent: 'center',
  alignItems: 'center',
}));
