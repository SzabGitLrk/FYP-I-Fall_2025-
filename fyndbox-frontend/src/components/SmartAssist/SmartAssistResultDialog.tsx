import { FC } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlineRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SmartAssistPrimaryButton } from './SmartAssistModal.styles';

interface SmartAddResultDialogProps {
  message: string;
  onClose: () => void;
  open: boolean;
  warnings: string[];
}

const SmartAssistResultDialog: FC<SmartAddResultDialogProps> = ({
  message,
  onClose,
  open,
  warnings,
}) => {
  const { t } = useTranslation();
  const showWarningsOnly = warnings.length > 0;
  const savedSuccessfullyText = 'Saved successfully';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow:
            '0 32px 80px rgba(0, 0, 0, 0.22), 0 8px 24px rgba(0, 0, 0, 0.10)',
        },
      }}
    >
      {/* Gradient Header */}
      <Box
        sx={{
          background: showWarningsOnly
            ? 'linear-gradient(135deg, #b57a14 0%, #d4950e 100%)'
            : 'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
          px: { xs: 3, sm: 4 },
          pt: { xs: 2.5, sm: 3 },
          pb: { xs: 2, sm: 2.5 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -60,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            pointerEvents: 'none',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {showWarningsOnly ? (
              <WarningAmberRounded sx={{ color: '#fff', fontSize: 24 }} />
            ) : (
              <CheckCircleOutlineRounded
                sx={{ color: '#fff', fontSize: 24 }}
              />
            )}
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {showWarningsOnly
              ? t('smartAdd.warningsTitle', { defaultValue: 'Warnings' })
              : t('smartAdd.resultTitle', {
                  defaultValue: savedSuccessfullyText,
                })}
          </Typography>
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 2.5, pb: 1.5 }}>
        <Stack spacing={2}>
          {!showWarningsOnly && message && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineRounded fontSize="inherit" />}
              sx={{
                borderRadius: 3,
                backgroundColor: 'rgba(93, 157, 113, 0.07)',
                border: '1px solid rgba(93, 157, 113, 0.15)',
                '& .MuiAlert-icon': {
                  color: '#5d9d71',
                },
              }}
            >
              {message}
            </Alert>
          )}
          {warnings.length > 0 && (
            <Stack spacing={1}>
              {!showWarningsOnly && (
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t('smartAdd.warningsTitle', { defaultValue: 'Warnings' })}
                </Typography>
              )}
              {warnings.map((warning) => (
                <Alert
                  key={warning}
                  severity="warning"
                  sx={{
                    borderRadius: 3,
                    border: '1px solid rgba(181, 122, 20, 0.15)',
                  }}
                >
                  {warning}
                </Alert>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: 0.5 }}>
        <SmartAssistPrimaryButton variant="contained" onClick={onClose}>
          {t('smartAdd.resultClose', { defaultValue: 'Close' })}
        </SmartAssistPrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default SmartAssistResultDialog;
