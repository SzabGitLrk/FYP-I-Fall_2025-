import { Avatar, Box, IconButton, styled } from '@mui/material';

export const AccountSettingsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  justifyItems: 'center',
  gap: theme.spacing(1.4),
  width: '100%',
  padding: theme.spacing(0.4, 0, 0),
  '& [class*="TextFieldsContainer"]': {
    display: 'grid',
    gap: theme.spacing(1.7),
    width: '100%',
  },
}));

export const ProfileContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: theme.spacing(0.5, 0, 1.3),
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
  width: 112,
  height: 112,
  objectFit: 'cover',
  backgroundColor: theme.palette.primary.main,
  border: '4px solid rgba(255, 255, 255, 0.9)',
  boxShadow: '0 16px 32px rgba(31, 43, 37, 0.14)',
  color: theme.palette.common.white,
  fontSize: '2.5rem',
  fontWeight: 900,
  '& .MuiSvgIcon-root': {
    fontSize: 66,
  },
  [theme.breakpoints.down('sm')]: {
    width: 94,
    height: 94,
  },
}));

export const AvatarButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(-1.2),
  right: theme.spacing(-1.2),
  backgroundColor: theme.palette.common.white,
}));
