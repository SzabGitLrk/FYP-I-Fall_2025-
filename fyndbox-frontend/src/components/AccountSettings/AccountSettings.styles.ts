import { Avatar, Box, IconButton, styled } from '@mui/material';

export const AccountSettingsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(0.8),
  width: '100%',
  padding: theme.spacing(0, 0, 0.2),
  '& [class*="TextFieldsContainer"]': {
    display: 'grid',
    gap: theme.spacing(1.2),
    width: '100%',
  },
}));

export const ProfileContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: theme.spacing(0.2, 0, 0.6),
  '& .MuiIconButton-root': {
    width: 36,
    height: 36,
    right: -6,
    bottom: -6,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: '3px solid #FFFFFF',
    boxShadow: '0 10px 20px rgba(21, 113, 69, 0.2)',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

export const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 92,
  height: 92,
  objectFit: 'cover',
  backgroundColor: theme.palette.primary.main,
  border: '4px solid rgba(255, 255, 255, 0.9)',
  boxShadow: '0 16px 32px rgba(31, 43, 37, 0.14)',
  color: theme.palette.common.white,
  fontSize: '2.2rem',
  fontWeight: 900,
  '& .MuiSvgIcon-root': {
    fontSize: 56,
  },
  [theme.breakpoints.down('sm')]: {
    width: 80,
    height: 80,
  },
}));

export const AvatarButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(-1.2),
  right: theme.spacing(-1.2),
  backgroundColor: theme.palette.common.white,
}));
