import { FC } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { CheckCircleOutlineRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SmartAddResultDialogProps {
  message: string;
  onClose: () => void;
  open: boolean;
  warnings: string[];
}

const SmartAddResultDialog: FC<SmartAddResultDialogProps> = ({
  message,
  onClose,
  open,
  warnings,
}) => {
  const { t } = useTranslation();
  const showWarningsOnly = warnings.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {showWarningsOnly
          ? t('smartAdd.warningsTitle', { defaultValue: 'Warnings' })
          : t('smartAdd.resultTitle', { defaultValue: 'Saved successfully' })}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!showWarningsOnly && message && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineRounded fontSize="inherit" />}
              sx={{ borderRadius: 2 }}
            >
              {message}
            </Alert>
          )}
          {warnings.length > 0 && (
            <Stack spacing={1}>
              {!showWarningsOnly && (
                <Typography variant="subtitle2">
                  {t('smartAdd.warningsTitle', { defaultValue: 'Warnings' })}
                </Typography>
              )}
              {warnings.map((warning) => (
                <Alert key={warning} severity="warning">
                  {warning}
                </Alert>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: '999px',
            minWidth: 160,
            px: 3,
            textTransform: 'none',
          }}
        >
          {t('smartAdd.resultClose', { defaultValue: 'Close' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SmartAddResultDialog;
