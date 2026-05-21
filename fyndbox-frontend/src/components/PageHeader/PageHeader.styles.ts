import { styled, Typography } from '@mui/material';

export const StyledHeader = styled(Typography)(({ theme }) => ({
  padding: 0,
  alignSelf: 'flex-start',
  color: 'inherit',
  fontSize: '2rem',
  lineHeight: 1.05,
  fontWeight: 900,
  letterSpacing: 0,
  textShadow: '0 10px 22px rgba(4, 63, 37, 0.18)',
  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(10.8),
    fontSize: '1.86rem',
    lineHeight: 1.12,
    textShadow: '0 10px 24px rgba(0, 28, 14, 0.2)',
  },
}));
