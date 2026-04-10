import { Box, Container, styled } from '@mui/material';

export const DashboardContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(0, 0),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.1),
  paddingTop: theme.spacing(5),
  // Reserve space for the fixed footer so inline action buttons stay fully visible.
  paddingBottom: `calc(${theme.spacing(16)} + env(safe-area-inset-bottom, 0px))`,
}));

export const SubContainer = styled(Box)(({}) => ({
  //marginLeft: theme.spacing(1.2),
}));

export const PrimaryActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  margin: theme.spacing(6, 0, 2),
}));
