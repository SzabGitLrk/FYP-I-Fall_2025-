import { FC, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  ImageSearchRounded,
  KeyboardVoiceRounded,
  KeyboardArrowRightRounded,
  NotesRounded,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SmartAssistSecondaryButton } from './SmartAssistModal.styles';

type SmartAssistAction = 'text' | 'voice' | 'image';

interface SmartAssistActionDialogProps {
  onClose: () => void;
  onSelectTextAdd: () => void;
  onSelectVoiceAdd: () => void;
  onSelectImageAdd: () => void;
  open: boolean;
}

const SmartAssistActionDialog: FC<SmartAssistActionDialogProps> = ({
  onClose,
  onSelectTextAdd,
  onSelectVoiceAdd,
  onSelectImageAdd,
  open,
}) => {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] =
    useState<SmartAssistAction>('text');

  const actionCards: Array<{
    action: SmartAssistAction;
    icon: typeof NotesRounded;
    label: string;
    status: string;
  }> = [
    {
      action: 'text',
      icon: NotesRounded,
      label: t('smartAdd.textAdd', { defaultValue: 'Smart Text Add' }),
      status: t('smartAdd.openNow', { defaultValue: 'Open' }),
    },
    {
      action: 'voice',
      icon: KeyboardVoiceRounded,
      label: t('smartAdd.voiceAdd', { defaultValue: 'Voice Add' }),
      status: t('smartAdd.openNow', { defaultValue: 'Open' }),
    },
    {
      action: 'image',
      icon: ImageSearchRounded,
      label: t('smartAdd.imageAdd', { defaultValue: 'Image Add' }),
      status: t('smartAdd.openNow', { defaultValue: 'Open' }),
    },
  ];

  useEffect(() => {
    if (open) {
      // Reopen the chooser in its default state so placeholder messages do not linger.
      setSelectedAction('text');
    }
  }, [open]);

  const placeholderMessage = useMemo(() => {
    if (selectedAction === 'voice') {
      return t('smartAdd.voicePending', {
        defaultValue:
          'Voice Add is not implemented yet. We will work on it later.',
      });
    }

    return null;
  }, [selectedAction, t]);

  const handleSelectAction = (action: SmartAssistAction) => {
    if (action === 'text') {
      onSelectTextAdd();
      return;
    }

    if (action === 'voice') {
      onSelectVoiceAdd();
      return;
    }

    if (action === 'image') {
      onSelectImageAdd();
      return;
    }

    setSelectedAction(action);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 5,
          px: { xs: 1, sm: 2 },
          py: { xs: 1, sm: 1.5 },
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,248,1) 100%)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.18)',
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
        {t('smartAdd.entryTitle', { defaultValue: 'Smart Add' })}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stack spacing={1.5}>
          {actionCards.map(({ action, icon: ActionIcon, label, status }) => (
            <ButtonBase
              key={action}
              onClick={() => handleSelectAction(action)}
              sx={{
                width: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'rgba(16, 24, 40, 0.08)',
                backgroundColor: 'common.white',
                px: 2.25,
                py: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
                transition:
                  'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)',
                  borderColor: 'rgba(31, 122, 75, 0.28)',
                },
              }}
            >
              <Stack direction="row" spacing={1.75} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(31, 122, 75, 0.08)',
                    color: 'primary.main',
                  }}
                >
                  <ActionIcon />
                </Box>
                <Typography variant="h6" color="secondary.contrastText">
                  {label}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.4,
                    borderRadius: '999px',
                    backgroundColor: 'rgba(15, 23, 42, 0.05)',
                    color: 'text.secondary',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {status}
                </Box>
                <KeyboardArrowRightRounded sx={{ color: 'text.secondary' }} />
              </Stack>
            </ButtonBase>
          ))}

          {placeholderMessage && (
            <Alert
              severity="info"
              sx={{
                borderRadius: 3,
                mt: 0.5,
                backgroundColor: 'rgba(31, 122, 75, 0.08)',
              }}
            >
              {placeholderMessage}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
        <SmartAssistSecondaryButton variant="outlined" onClick={onClose}>
          {t('modal.cancel', { defaultValue: 'Cancel' })}
        </SmartAssistSecondaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default SmartAssistActionDialog;
