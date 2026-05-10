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
  width: '100%',
  marginTop: theme.spacing(1),
  padding: theme.spacing(2.5),
  borderRadius: '28px',
  background:
    'linear-gradient(180deg, rgba(236,244,255,0.96) 0%, rgba(225,238,255,0.92) 100%)',
  boxShadow: '0 24px 60px rgba(129, 169, 227, 0.22)',
}));

export const ImageLabel = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  textAlign: 'left',
  fontWeight: 700,
  color: theme.palette.text.primary,
}));

export const ImageDropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'dragActive',
})<{ dragActive?: boolean }>(({ theme, dragActive }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '220px',
  padding: theme.spacing(4, 3),
  borderRadius: '22px',
  border: `2px dashed ${dragActive ? '#60A5FA' : 'rgba(122, 167, 224, 0.65)'}`,
  backgroundColor: dragActive ? 'rgba(255, 255, 255, 0.94)' : 'rgba(255, 255, 255, 0.82)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
}));

export const ImageDropContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.25),
}));

export const UploadIconWrap = styled(Box)(() => ({
  width: 64,
  height: 64,
  borderRadius: '18px',
  background: 'linear-gradient(180deg, #F4F8FF 0%, #DCEBFF 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 10px 24px rgba(71, 131, 255, 0.18)',
}));

export const BrowseText = styled('span')(() => ({
  color: '#2563EB',
  fontWeight: 700,
}));

export const ImageBox = styled('img')(({ theme }) => ({
  width: '100%',
  maxHeight: 220,
  borderRadius: '18px',
  objectFit: 'cover',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
  marginBottom: theme.spacing(1.5),
}));

export const UploadStatusCard = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  width: '100%',
  borderRadius: '16px',
  padding: theme.spacing(1.5, 2),
  backgroundColor: 'rgba(255, 255, 255, 0.72)',
  border: '1px solid rgba(200, 219, 244, 0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
}));

export const UploadStatusText = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

export const UploadStatusActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  flexShrink: 0,
}));

export const ClearButton = styled(IconButton)(() => ({
  color: '#F87171',
  backgroundColor: 'rgba(254, 242, 242, 0.95)',
  '&:hover': {
    backgroundColor: 'rgba(254, 226, 226, 1)',
  },
}));

export const StatusIconButton = styled(IconButton)(() => ({
  color: '#93A5C4',
  backgroundColor: 'rgba(248, 250, 252, 0.96)',
  '&:hover': {
    backgroundColor: 'rgba(241, 245, 249, 1)',
  },
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
