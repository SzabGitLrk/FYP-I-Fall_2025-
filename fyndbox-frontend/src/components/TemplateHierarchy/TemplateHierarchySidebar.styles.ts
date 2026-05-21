import { Box, Button, Drawer, styled, Typography } from '@mui/material';

export const TemplateDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    display: 'flex',
    flexDirection: 'column',
    width: 'min(88vw, 360px)',
    maxWidth: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    border: 'none',
    boxShadow: '-18px 0 48px rgba(8, 38, 27, 0.22)',
    color: theme.palette.primary.dark,
    backgroundColor: theme.palette.common.white,
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDrawer-paper': {
      width: '86vw',
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
    },
  },
}));

export const TemplateHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '48px 1fr 48px',
  alignItems: 'center',
  minHeight: 64,
  padding: theme.spacing(1, 1.25),
  background: theme.palette.common.white,
  boxShadow: '0 5px 16px rgba(20, 54, 39, 0.08)',
  position: 'relative',
  zIndex: 1,
  '& .MuiIconButton-root': {
    color: theme.palette.primary.dark,
  },
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 700,
  color: theme.palette.primary.dark,
  fontSize: '1.05rem',
}));

export const HeaderSpacer = styled(Box)({
  width: 48,
  height: 48,
});

export const TemplateContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  backgroundColor: '#F6FAF7',
}));

export const TemplateSubtitle = styled(Typography)(({ theme }) => ({
  color: '#5E7167',
  fontSize: '0.875rem',
  lineHeight: 1.5,
  marginBottom: theme.spacing(1.5),
}));

export const StorageRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minHeight: 48,
  padding: theme.spacing(1, 0),
  '& .MuiIconButton-root': {
    width: 32,
    height: 32,
    color: theme.palette.primary.dark,
  },
  '& .MuiCheckbox-root': {
    color: theme.palette.primary.main,
    padding: theme.spacing(0.5),
  },
}));

export const StorageLabel = styled(Typography)({
  fontWeight: 700,
  fontSize: '0.95rem',
  color: '#063F25',
});

export const StorageChildren = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(4),
  paddingLeft: theme.spacing(2.5),
  paddingTop: theme.spacing(0.5),
  borderLeft: `2px solid ${theme.palette.grey[300]}`,
}));

export const BoxRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minHeight: 44,
  padding: theme.spacing(0.75, 0),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -20,
    top: '50%',
    width: 16,
    height: 0,
    borderTop: `2px solid ${theme.palette.grey[300]}`,
  },
  '& .MuiIconButton-root': {
    width: 30,
    height: 30,
    color: theme.palette.primary.dark,
  },
  '& .MuiCheckbox-root': {
    color: theme.palette.primary.main,
    padding: theme.spacing(0.5),
  },
}));

export const BoxLabel = styled(Typography)({
  fontWeight: 600,
  fontSize: '0.88rem',
  color: '#174D38',
});

export const BoxChildren = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(4),
  paddingLeft: theme.spacing(2.5),
  paddingTop: theme.spacing(0.5),
  borderLeft: `2px solid ${theme.palette.grey[300]}`,
}));

export const ItemRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minHeight: 42,
  padding: theme.spacing(0.5, 0),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -20,
    top: '50%',
    width: 16,
    height: 0,
    borderTop: `2px solid ${theme.palette.grey[300]}`,
  },
  '& .MuiCheckbox-root': {
    color: theme.palette.primary.main,
    padding: theme.spacing(0.5),
  },
}));

export const ItemLabel = styled(Typography)({
  fontWeight: 500,
  fontSize: '0.85rem',
  color: '#3B5248',
});

export const HierarchyIcon = styled('img')({
  width: 22,
  height: 22,
  objectFit: 'contain',
  flexShrink: 0,
});

export const TemplateFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.grey[200]}`,
  boxShadow: '0 -5px 16px rgba(20, 54, 39, 0.06)',
}));

export const FooterHint = styled(Typography)({
  color: '#5E7167',
  fontSize: '0.75rem',
  lineHeight: 1.5,
  fontStyle: 'italic',
});

export const ReviewButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  borderRadius: 12,
  fontWeight: 700,
  fontSize: '0.95rem',
  padding: theme.spacing(1.2, 0),
  textTransform: 'none',
  boxShadow: '0 8px 20px rgba(21, 113, 69, 0.18)',
  '&:hover': {
    boxShadow: '0 10px 24px rgba(21, 113, 69, 0.24)',
  },
  '&.Mui-disabled': {
    boxShadow: 'none',
  },
}));
