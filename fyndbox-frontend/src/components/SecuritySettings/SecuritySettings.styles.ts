import { Box, styled } from '@mui/material';

export const SecuritySettingsContainer = styled(Box)(({ theme }) => ({
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
