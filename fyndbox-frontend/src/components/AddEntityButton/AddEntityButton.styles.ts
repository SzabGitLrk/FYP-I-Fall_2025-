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
  margin: $layout === 'inline' ? 0 : theme.spacing(6, 0),
}));

export const FabContainer = styled(Fab)(({ theme }) => ({
  zIndex: 0,
  backgroundColor: theme.palette.secondary.contrastText,
  color: theme.palette.secondary.main,
  '&:hover': {
    backgroundColor: theme.palette.grey[700],
  },
}));

export const Label = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
}));
