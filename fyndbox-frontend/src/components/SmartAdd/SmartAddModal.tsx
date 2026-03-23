import { FC, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
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
  SmartAddClarificationOption,
} from '../../types/ai';
import {
  SmartAddActionRow,
  SmartAddContent,
  SmartAddDescription,
  SmartAddPrimaryButton,
  SmartAddSecondaryButton,
} from './SmartAddModal.styles';

interface SmartAddModalProps {
  onClose: () => void;
  onSaved: (result: {
    message: string;
    warnings?: string[];
    reviewed?: boolean;
  }) => void;
  open: boolean;
}

const SmartAddModal: FC<SmartAddModalProps> = ({ onClose, onSaved, open }) => {
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

  const clarificationOptions: SmartAddClarificationOption[] =
    processResult?.classified?.clarificationOptions ?? [];

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

  const fallbackAlertSeverity = useMemo<'warning' | 'info'>(() => {
    return processResult?.fallbackToLLM ? 'warning' : 'info';
  }, [processResult]);

  const formatRequestError = (error: unknown): string => {
    const message =
      error instanceof Error ? error.message : t('smartAdd.requestFailed');

    if (/Cannot\s+POST\s+\/ai\/process-text/i.test(message)) {
      return t('smartAdd.serviceUnavailable');
    }

    return message || t('smartAdd.requestFailed');
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
      setRequestError(t('smartAdd.emptyPrompt'));
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
    option: SmartAddClarificationOption,
  ) => {
    setPrompt(option.prompt);
    await submitPrompt(option.prompt);
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <ModalBox>
            <CancelButton onClick={onClose}>
              <Close />
            </CancelButton>

            <SmartAddContent>
              <Typography variant="h4">{t('smartAdd.title')}</Typography>

              <SmartAddDescription variant="body1">
                {t('smartAdd.description')}
              </SmartAddDescription>

              <CustomTextField
                label={t('smartAdd.instructionLabel')}
                placeholder={t('smartAdd.placeholder')}
                value={prompt}
                multiline
                minRows={4}
                onChange={(event) => handlePromptChange(event.target.value)}
              />

              {requestError && <Alert severity="error">{requestError}</Alert>}

              {processResult?.fallbackToLLM && (
                <Stack spacing={1}>
                  <Alert severity={fallbackAlertSeverity}>
                    {t('smartAdd.fallbackToLlm', {
                      defaultValue:
                        'This instruction needs manual review and will fall back to AI assistance.',
                    })}
                  </Alert>

                  {clarificationOptions.length > 0 && (
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
                  )}
                </Stack>
              )}

              {persistError && <Alert severity="error">{persistError}</Alert>}

              <SmartAddActionRow>
                <SmartAddSecondaryButton
                  variant="outlined"
                  onClick={onClose}
                  disabled={isProcessing || isConfirming}
                >
                  {t('modal.cancel')}
                </SmartAddSecondaryButton>

                <SmartAddPrimaryButton
                  variant="contained"
                  onClick={handleSave}
                  disabled={isProcessing || isConfirming}
                >
                  {isProcessing || isConfirming
                    ? t('smartAdd.confirming')
                    : t('smartAdd.submit')}
                </SmartAddPrimaryButton>
              </SmartAddActionRow>
            </SmartAddContent>
          </ModalBox>
        </ModalContainer>
      </Modal>

      <Dialog
        open={requiresConfirmation}
        onClose={() => setProcessResult(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t('smartAdd.confirmationTitle', {
            defaultValue: 'Confirm Changes',
          })}
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {reviewMessage}
          </Alert>
        </DialogContent>

        <DialogActions sx={{ padding: 2 }}>
          <SmartAddSecondaryButton
            variant="outlined"
            onClick={() => setProcessResult(null)}
            disabled={isConfirming}
          >
            {isDeleteWarningConfirmation
              ? t('modal.cancel', { defaultValue: 'Cancel' })
              : t('smartAdd.reject', { defaultValue: 'No' })}
          </SmartAddSecondaryButton>

          <SmartAddPrimaryButton
            variant="contained"
            startIcon={<Check />}
            onClick={() => handleConfirm()}
            disabled={isConfirming}
          >
            {isConfirming
              ? t('smartAdd.confirming')
              : isDeleteWarningConfirmation
                ? t('smartAdd.ok', { defaultValue: 'OK' })
                : t('smartAdd.approve', { defaultValue: 'Yes' })}
          </SmartAddPrimaryButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SmartAddModal;
