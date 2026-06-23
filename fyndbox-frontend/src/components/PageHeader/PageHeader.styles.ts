import { styled, Typography } from '@mui/material';

export const StyledHeader = styled(Typography)(({ theme }) => ({
  padding: 0,
  alignSelf: 'flex-start',
  color: 'inherit',
  fontSize: '3rem',
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: 0,
  textShadow: '0 12px 26px rgba(0, 35, 18, 0.32)',
  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(10.8),
    fontSize: '2.2rem',
    lineHeight: 1.12,
    textShadow: '0 10px 24px rgba(0, 28, 14, 0.2)',
  },
}));
