import { Box, Button, Paper, Stack, Typography, styled } from '@mui/material';

export const SmartAddContent = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingTop: theme.spacing(5),
}));

export const SmartAddDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textAlign: 'left',
}));

export const SmartAddActionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  justifyContent: 'center',
  flexWrap: 'wrap',
}));

export const SmartAddPrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '999px',
  minWidth: '10rem',
  padding: theme.spacing(1.25, 2.5),
  textTransform: 'none',
}));

export const SmartAddSecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '999px',
  minWidth: '8.5rem',
  padding: theme.spacing(1.25, 2.5),
  textTransform: 'none',
  borderColor: theme.palette.primary.main,
  color: theme.palette.primary.main,
}));

export const SmartAddSummaryCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'left',
  backgroundColor: theme.palette.grey[100],
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  whiteSpace: 'pre-line',
}));

export const SmartAddSectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  color: theme.palette.secondary.contrastText,
}));

export const SmartAddList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
}));
