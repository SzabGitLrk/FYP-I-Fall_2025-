import { Box, IconButton, styled, TextField } from '@mui/material';

export const SearchFieldContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  marginTop: theme.spacing(-3.1),
  padding: theme.spacing(0, 0, 2.4),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(-9),
    padding: theme.spacing(0, 1.8, 2.7),
  },
}));

export const SearchIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  borderRadius: '50%',
  padding: theme.spacing(0.8),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export const SearchTextField = styled(TextField)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: '50px',
  width: '100%',
  maxWidth: 720,
  border: '3px solid rgba(21, 113, 69, 0.26)',
  boxShadow:
    '0 18px 38px rgba(26, 45, 34, 0.18), 0 0 0 10px rgba(21, 113, 69, 0.08)',
  '& .MuiOutlinedInput-root': {
    minHeight: 66,
    paddingLeft: theme.spacing(2.4),
    borderRadius: '50px',
    color: '#17231C',
    fontWeight: 500,
    '& fieldset': {
      borderColor: 'rgba(21, 113, 69, 0.34)',
      borderWidth: 2,
    },
    '&:hover fieldset': {
      borderColor: 'rgba(21, 113, 69, 0.44)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
      boxShadow: '0 0 0 8px rgba(21, 113, 69, 0.16)',
    },
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(2.2, 1.2, 2.2, 0.2),
    fontSize: '1.08rem',
  },
  '& .MuiInputAdornment-positionStart': {
    marginRight: theme.spacing(1.4),
  },
  '& .MuiSvgIcon-root': {
    width: 25,
    height: 25,
    color: '#7C8480',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 10px 24px rgba(5, 54, 31, 0.18)',
    '& .MuiOutlinedInput-root': {
      minHeight: 50,
    },
    '& .MuiInputBase-input': {
      paddingTop: theme.spacing(1.2),
      paddingBottom: theme.spacing(1.2),
      fontSize: '0.86rem',
    },
  },
}));
