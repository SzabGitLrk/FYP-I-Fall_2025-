import { FC, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';
import {
  ImageSearchRounded,
  KeyboardVoiceRounded,
  KeyboardArrowRightRounded,
  NotesRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
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
    description: string;
    gradient: string;
    iconBg: string;
  }> = [
      {
        action: 'text',
        icon: NotesRounded,
        label: t('smartAdd.textAdd', { defaultValue: 'Smart Text Add' }),
        description: t('smartAdd.textAddDesc', {
          defaultValue: 'Type natural language instructions to create inventory',
        }),
        gradient: 'linear-gradient(135deg, rgba(93, 157, 113, 0.95) 0%, rgba(73, 139, 96, 0.95) 100%)',
        iconBg: 'rgba(93, 157, 113, 0.10)',
      },
      {
        action: 'voice',
        icon: KeyboardVoiceRounded,
        label: t('smartAdd.voiceAdd', { defaultValue: 'Voice Add' }),
        description: t('smartAdd.voiceAddDesc', {
          defaultValue: 'Speak your instructions hands-free with live transcription',
        }),
        gradient: 'linear-gradient(135deg, rgba(83, 149, 106, 0.95) 0%, rgba(63, 131, 88, 0.95) 100%)',
        iconBg: 'rgba(83, 149, 106, 0.10)',
      },
      {
        action: 'image',
        icon: ImageSearchRounded,
        label: t('smartAdd.imageAdd', { defaultValue: 'Image Add' }),
        description: t('smartAdd.imageAddDesc', {
          defaultValue: 'Upload a photo and let AI detect items automatically',
        }),
        gradient: 'linear-gradient(135deg, rgba(73, 139, 96, 0.95) 0%, rgba(58, 125, 82, 0.95) 100%)',
        iconBg: 'rgba(73, 139, 96, 0.10)',
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
          overflow: 'hidden',
          backgroundImage: 'none',
          backgroundColor: '#fafcfa',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.22), 0 8px 24px rgba(0, 0, 0, 0.10)',
          '@keyframes smartAddSlideUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(16px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        },
      }}
    >
      {/* Gradient Header */}
      <Box
        sx={(theme) => ({
          background: 'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
          px: { xs: 3, sm: 4 },
          pt: { xs: 3, sm: 3.5 },
          pb: { xs: 2.5, sm: 3 },
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
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            pointerEvents: 'none',
          },
        })}
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
            <AutoAwesomeRounded sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              {t('smartAdd.entryTitle', { defaultValue: 'Smart Add' })}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.78)',
                fontWeight: 400,
                mt: 0.25,
              }}
            >
              {t('smartAdd.entrySubtitle', {
                defaultValue: 'Choose how you want to add items',
              })}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 2.5, pb: 1.5 }}>
        <Stack spacing={1.5}>
          {actionCards.map(({ action, icon: ActionIcon, label, description, gradient, iconBg }, index) => (
            <ButtonBase
              key={action}
              onClick={() => handleSelectAction(action)}
              sx={{
                width: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'rgba(93, 157, 113, 0.10)',
                backgroundColor: 'common.white',
                px: 2.5,
                py: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
                animation: `smartAddSlideUp 400ms ${100 + index * 80}ms ease-out both`,
                transition:
                  'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease, border-color 200ms ease, background-color 200ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 40px rgba(93, 157, 113, 0.16), 0 4px 12px rgba(0, 0, 0, 0.04)',
                  borderColor: 'rgba(93, 157, 113, 0.30)',
                  backgroundColor: 'rgba(93, 157, 113, 0.03)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 4px 12px rgba(93, 157, 113, 0.10)',
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: gradient,
                    boxShadow: `0 6px 16px ${iconBg.replace('0.10', '0.24')}`,
                    flexShrink: 0,
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                  }}
                >
                  <ActionIcon sx={{ color: '#fff', fontSize: 26 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: 'secondary.contrastText',
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.25,
                      lineHeight: 1.4,
                      fontSize: '0.8rem',
                    }}
                  >
                    {description}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(93, 157, 113, 0.06)',
                  flexShrink: 0,
                  ml: 1.5,
                  transition: 'background-color 200ms ease, transform 200ms ease',
                  '.MuiButtonBase-root:hover &': {
                    backgroundColor: 'rgba(93, 157, 113, 0.12)',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <KeyboardArrowRightRounded
                  sx={{ color: 'primary.main', fontSize: 20 }}
                />
              </Box>
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
      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: 0.5 }}>
        <SmartAssistSecondaryButton
          variant="outlined"
          onClick={onClose}
          sx={{
            borderWidth: '1.5px',
            fontWeight: 600,
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: 'rgba(93, 157, 113, 0.06)',
            },
          }}
        >
          {t('modal.cancel', { defaultValue: 'Cancel' })}
        </SmartAssistSecondaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default SmartAssistActionDialog;
