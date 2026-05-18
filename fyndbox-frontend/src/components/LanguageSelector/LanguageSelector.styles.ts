import { Box, styled, Typography } from '@mui/material';

interface LanguageOptionProps {
  isActive: boolean;
}

interface LanguageSelectorWrapperProps {
  compact?: boolean;
}

export const LanguageSelectorWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'compact',
})<LanguageSelectorWrapperProps>(({ theme, compact }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: compact ? theme.spacing(1.8, 0, 0) : theme.spacing(6, 0),
  justifyContent: 'center',
  textAlign: 'center',
  color: compact ? '#1F2B25' : 'inherit',
  '& .MuiTypography-root': {
    fontSize: compact ? '0.86rem' : undefined,
    fontWeight: compact ? 600 : undefined,
  },
}));

export const FlagIcon = styled('img')(({ theme }) => ({
  width: '1.5rem',
  height: '1.5rem',
  borderRadius: '50%',
  marginRight: theme.spacing(1),
}));

export const LanguageOption = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<LanguageOptionProps>(
  ({ theme, isActive }: { theme: any; isActive?: boolean }) => ({
    cursor: 'pointer',
    marginLeft: theme.spacing(1),
    color: isActive ? theme.palette.primary.main : 'inherit',
    '&:hover': {
      color: theme.palette.primary.dark,
    },
  }),
);

export const Divider = styled('span')(({ theme }) => ({
  margin: theme.spacing(0, 1),
  color: theme.palette.grey[400],
}));
