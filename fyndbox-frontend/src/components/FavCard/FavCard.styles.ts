import { Box, IconButton, styled } from '@mui/material';

export const FavCardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  minHeight: 84,
  backgroundColor: theme.palette.common.white,
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15, 57, 39, 0.08)',
  '&:hover': {
    backgroundColor: '#F7FBF8',
    transform: 'translateY(-1px)',
  },
  cursor: 'pointer',
  transition: 'background-color 0.2s, transform 0.2s, box-shadow 0.2s',
  width: '100%',
}));

export const FavoriteCardContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

export const FavoriteCardImage = styled('img')(({ theme }) => ({
  width: 54,
  height: 54,
  flexShrink: 0,
  borderRadius: theme.spacing(1.25),
  objectFit: 'cover',
  backgroundColor: '#E9F1EC',
  padding: theme.spacing(0.75),
}));

export const FavoriteCardText = styled(Box)(({ theme }) => ({
  minWidth: 0,
  color: theme.palette.primary.dark,
  '& .MuiTypography-h6': {
    fontSize: '1rem',
    fontWeight: 900,
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiTypography-body1': {
    color: '#5E7167',
    fontSize: '0.875rem',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

export const FavoriteDeleteButton = styled(IconButton)(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.error.main,
  backgroundColor: '#FFF4F4',
  '&:hover': {
    backgroundColor: '#FFE7E7',
  },
}));

