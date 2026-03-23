import { Box, Card, styled, Typography } from '@mui/material';

interface EntityCardContainerProps {
  isBoxCard: boolean;
}

export const EntityCardContainer = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isBoxCard',
})<EntityCardContainerProps>(({ theme, isBoxCard }) => ({
  backgroundColor: isBoxCard
    ? theme.palette.primary.light
    : theme.palette.primary.main,
  borderRadius: theme.spacing(0.1),
  marginBottom: theme.spacing(0.6),
  color: theme.palette.primary.contrastText,
}));

export const ImageBox = styled('img')(({ theme }) => ({
  width: 60,
  height: 60,
  marginRight: theme.spacing(2),
  objectFit: 'cover',
}));

export const ContentBox = styled(Box)({
  flex: 3,
  minWidth: 0,
});

export const NameText = styled(Typography)({
  wordBreak: 'break-word',
});

export const DescriptionText = styled(Typography)({
  wordBreak: 'break-word',
});
