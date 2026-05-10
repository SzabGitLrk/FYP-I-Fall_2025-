import { FC, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  DialogProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import CustomTextField from '../CustomTextField/CustomTextField';
import {
  CancelButton,
  ModalBox,
  ModalContainer,
} from '../Modal/EntityActionModal.styles';
import { useProcessTextInput, useConfirmAiResult } from '../../hooks/useAi';
import {
  ConfirmAiResultRequest,
  ProcessTextResult,
  SmartAssistClarificationOption,
} from '../../types/ai';
import {
  SmartAssistActionRow,
  SmartAssistContent,
  SmartAssistPrimaryButton,
  SmartAssistSecondaryButton,
} from './SmartAssistModal.styles';

interface SmartAssistModalProps {
  onClose: () => void;
  onSaved: (result: {
    message: string;
    warnings?: string[];
    reviewed?: boolean;
  }) => void;
  open: boolean;
}

const SmartAssistModal: FC<SmartAssistModalProps> = ({
  onClose,
  onSaved,
  open,
}) => {
  const { t } = useTranslation();

  const [prompt, setPrompt] = useState('');
  const [processResult, setProcessResult] = useState<ProcessTextResult | null>(
    null,
  );
  const [requestError, setRequestError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);

  const { mutateAsync: processText, isPending: isProcessing } =
    useProcessTextInput();
  const { mutateAsync: confirmAiResult, isPending: isConfirming } =
    useConfirmAiResult();

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setProcessResult(null);
      setRequestError(null);
      setPersistError(null);
    }
  }, [open]);

  const clarificationOptions: SmartAssistClarificationOption[] =
    processResult?.classified?.clarificationOptions ?? [];
  const clarificationMessage = processResult?.classified?.clarification;
  const hasClarificationState = Boolean(
    clarificationMessage && !processResult?.parsedData,
  );

  const confirmationMessage = processResult?.parsedData?.confirmation;
  const requiresConfirmation = Boolean(
    processResult?.parsedData && confirmationMessage,
  );

  const isDeleteWarningConfirmation = confirmationMessage?.startsWith(
    'Deletion is not supported.',
  );

  const reviewMessage =
    confirmationMessage ??
    t('smartAdd.confirmationFallbackShort', {
      defaultValue: 'Please review this action before saving.',
    });

  const formatRequestError = (error: unknown): string => {
    const message =
      error instanceof Error
        ? error.message
        : t('smartAdd.requestFailed', {
            defaultValue: 'Unable to process the instruction right now.',
          });

    if (/Cannot\s+POST\s+\/ai\/process-text/i.test(message)) {
      return t('smartAdd.serviceUnavailable', {
        defaultValue: 'Smart Assist is temporarily unavailable. Please try again.',
      });
    }

    return (
      message ||
      t('smartAdd.requestFailed', {
        defaultValue: 'Unable to process the instruction right now.',
      })
    );
  };

  const resetFeedback = () => {
    setRequestError(null);
    setPersistError(null);
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setProcessResult(null);
    resetFeedback();
  };

  const handleConfirm = async (resultToConfirm = processResult) => {
    const parsedData = resultToConfirm?.parsedData;
    if (!parsedData) {
      return;
    }

    try {
      setPersistError(null);
      setRequestError(null);

      const payload: ConfirmAiResultRequest = {
        parsedData,
        confirmed: true,
      };

      const persistResult = await confirmAiResult(payload);

      onSaved({
        message: persistResult.message,
        warnings: persistResult.warnings ?? [],
        reviewed: Boolean(resultToConfirm?.parsedData?.confirmation),
      });

      onClose();
    } catch (error) {
      setPersistError(formatRequestError(error));
    }
  };

  const submitPrompt = async (nextPrompt: string) => {
    if (!nextPrompt.trim()) {
      setRequestError(
        t('smartAdd.emptyPrompt', {
          defaultValue: 'Enter an instruction before saving it.',
        }),
      );
      return;
    }

    try {
      resetFeedback();

      const processed = await processText({ text: nextPrompt.trim() });
      setProcessResult(processed);

      if (!processed.parsedData) {
        return;
      }

      if (processed.parsedData.confirmation) {
        return;
      }

      await handleConfirm(processed);
    } catch (error) {
      setRequestError(formatRequestError(error));
    }
  };

  const handleSave = async () => {
    await submitPrompt(prompt.trim());
  };

  const handleClarificationChoice = async (
    option: SmartAssistClarificationOption,
  ) => {
    setPrompt(option.prompt);
    await submitPrompt(option.prompt);
  };

  const handleModalClose = () => {
    if (requiresConfirmation) {
      return;
    }

    onClose();
  };

  const handleConfirmationDialogClose: DialogProps['onClose'] = (
    _event,
    reason,
  ) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }

    setProcessResult(null);
  };

  return (
    <>
      <Modal open={open} onClose={handleModalClose}>
        <ModalContainer>
          <ModalBox
            sx={(theme) => ({
              width: {
                xs: 'calc(100vw - 16px)',
                sm: 'min(92vw, 860px)',
                lg: 'min(86vw, 920px)',
              },
              maxHeight: {
                xs: 'calc(100vh - 16px)',
                sm: '88vh',
              },
              px: { xs: 1.5, sm: 2.25 },
              py: { xs: 1.25, sm: 1.75 },
              backgroundColor: theme.palette.background.paper,
            })}
          >
            <CancelButton onClick={handleModalClose}>
              <Close />
            </CancelButton>

            <SmartAssistContent sx={{ gap: 1.25, paddingTop: 2.25 }}>
              <Typography variant="h4" sx={{ mb: 0 }}>
                {t('smartAdd.textTitle', { defaultValue: 'Smart Text Add' })}
              </Typography>

              <Stack
                sx={(theme) => ({
                  borderRadius: 4,
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 1.5, sm: 1.75 },
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                <CustomTextField
                  label={t('smartAdd.instructionLabel', {
                    defaultValue: 'Instruction',
                  })}
                  placeholder={t('smartAdd.placeholder', {
                    defaultValue:
                      'Example: Create storage Garage with box Tools and 5 hammers',
                  })}
                  value={prompt}
                  multiline
                  minRows={3}
                  onChange={(event) => handlePromptChange(event.target.value)}
                />
              </Stack>

              {requestError && <Alert severity="error">{requestError}</Alert>}

              {hasClarificationState && (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    '& .MuiAlert-message': {
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    },
                  }}
                >
                  {clarificationMessage}
                </Alert>
              )}

              {clarificationOptions.length > 0 && (
                <Stack spacing={1}>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {t('smartAdd.suggestions', {
                        defaultValue: 'Suggestions',
                      })}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      {clarificationOptions.map((option) => (
                        <Button
                          key={`${option.kind}:${option.label}`}
                          variant="outlined"
                          onClick={() => handleClarificationChoice(option)}
                          disabled={isProcessing || isConfirming}
                          sx={{
                            borderRadius: '999px',
                            textTransform: 'none',
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </Stack>
              )}

              {persistError && <Alert severity="error">{persistError}</Alert>}

              <SmartAssistActionRow sx={{ mt: 0.5 }}>
                <SmartAssistSecondaryButton
                  variant="outlined"
                  onClick={onClose}
                  disabled={isProcessing || isConfirming}
                >
                  {t('modal.cancel')}
                </SmartAssistSecondaryButton>

                <SmartAssistPrimaryButton
                  variant="contained"
                  onClick={handleSave}
                  disabled={
                    isProcessing || isConfirming || hasClarificationState
                  }
                >
                  {isProcessing || isConfirming
                    ? t('smartAdd.confirming', { defaultValue: 'Saving...' })
                    : t('smartAdd.submit', { defaultValue: 'Save' })}
                </SmartAssistPrimaryButton>
              </SmartAssistActionRow>
            </SmartAssistContent>
          </ModalBox>
        </ModalContainer>
      </Modal>

      <Dialog
        open={requiresConfirmation}
        onClose={handleConfirmationDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t('smartAdd.confirmationTitle', {
            defaultValue: 'Confirm Changes',
          })}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            maxHeight: '55vh',
            overflowY: 'auto',
          }}
        >
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              alignItems: 'flex-start',
              '& .MuiAlert-message': {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              },
            }}
          >
            {reviewMessage}
          </Alert>
        </DialogContent>

        <DialogActions sx={{ padding: 2 }}>
          <SmartAssistSecondaryButton
            variant="outlined"
            onClick={() => setProcessResult(null)}
            disabled={isConfirming}
          >
            {isDeleteWarningConfirmation
              ? t('modal.cancel', { defaultValue: 'Cancel' })
              : t('smartAdd.reject', { defaultValue: 'No' })}
          </SmartAssistSecondaryButton>

          <SmartAssistPrimaryButton
            variant="contained"
            startIcon={<Check />}
            onClick={() => handleConfirm()}
            disabled={isConfirming}
          >
            {isConfirming
              ? t('smartAdd.confirming', { defaultValue: 'Saving...' })
              : isDeleteWarningConfirmation
                ? t('smartAdd.ok', { defaultValue: 'OK' })
                : t('smartAdd.approve', { defaultValue: 'Yes' })}
          </SmartAssistPrimaryButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SmartAssistModal;
