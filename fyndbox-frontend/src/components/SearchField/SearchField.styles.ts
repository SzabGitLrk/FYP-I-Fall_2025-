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
  maxWidth: 520,
  boxShadow: '0 10px 24px rgba(26, 45, 34, 0.13)',
  '& .MuiOutlinedInput-root': {
    minHeight: 54,
    paddingLeft: theme.spacing(2),
    borderRadius: '50px',
    color: '#17231C',
    fontWeight: 500,
    '& fieldset': {
      borderColor: 'rgba(12, 64, 38, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(12, 64, 38, 0.18)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 3px rgba(21, 113, 69, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.7, 1, 1.7, 0.2),
    fontSize: '1rem',
  },
  '& .MuiInputAdornment-positionStart': {
    marginRight: theme.spacing(1.1),
  },
  '& .MuiSvgIcon-root': {
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
