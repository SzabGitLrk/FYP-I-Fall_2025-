import { Box, Fab, styled, Typography } from '@mui/material';

interface AddEntityContainerProps {
  $layout?: 'default' | 'inline';
}

export const AddEntityContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$layout',
})<AddEntityContainerProps>(({ theme, $layout = 'default' }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: $layout === 'inline' ? 0 : theme.spacing(3, 0),
}));

export const FabContainer = styled(Fab)(({ theme }) => ({
  zIndex: 0,
  background: 'linear-gradient(180deg, #198D54 0%, #0B6C3B 100%)',
  color: theme.palette.common.white,
  boxShadow: '0 12px 22px rgba(8, 91, 48, 0.28)',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export const Label = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontWeight: 800,
}));
