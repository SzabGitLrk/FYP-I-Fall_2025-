import { Box, styled } from '@mui/material';

export const SecuritySettingsContainer = styled(Box)(({ theme }) => ({
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
