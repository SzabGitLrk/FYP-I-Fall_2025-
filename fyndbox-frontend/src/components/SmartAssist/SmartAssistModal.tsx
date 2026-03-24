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
  SmartAssistClarificationOption,
} from '../../types/ai';
import {
  SmartAssistActionRow,
  SmartAssistContent,
  SmartAssistDescription,
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

  const confirmationMessage = processResult?.parsedData?.confirmation;
  const requiresConfirmation = Boolean(
    processResult?.parsedData && confirmationMessage,
  );

  const isDeleteWarningConfirmation = confirmationMessage?.startsWith(
    'Deletion is not supported.',
  );

  const reviewMessage =
    confirmationMessage ??
    t('smartAssist.confirmationFallbackShort', {
      defaultValue: 'Please review this action before saving.',
    });

  const fallbackAlertSeverity = useMemo<'warning' | 'info'>(() => {
    return processResult?.fallbackToLLM ? 'warning' : 'info';
  }, [processResult]);

  const formatRequestError = (error: unknown): string => {
    const message =
      error instanceof Error ? error.message : t('smartAssist.requestFailed');

    if (/Cannot\s+POST\s+\/ai\/process-text/i.test(message)) {
      return t('smartAssist.serviceUnavailable');
    }

    return message || t('smartAssist.requestFailed');
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
      setRequestError(t('smartAssist.emptyPrompt'));
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

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <ModalBox>
            <CancelButton onClick={onClose}>
              <Close />
            </CancelButton>

            <SmartAssistContent>
              <Typography variant="h4">{t('smartAssist.title')}</Typography>

              <SmartAssistDescription variant="body1">
                {t('smartAssist.description')}
              </SmartAssistDescription>

              <CustomTextField
                label={t('smartAssist.instructionLabel')}
                placeholder={t('smartAssist.placeholder')}
                value={prompt}
                multiline
                minRows={4}
                onChange={(event) => handlePromptChange(event.target.value)}
              />

              {requestError && <Alert severity="error">{requestError}</Alert>}

              {processResult?.fallbackToLLM && (
                <Stack spacing={1}>
                  <Alert severity={fallbackAlertSeverity}>
                    {t('smartAssist.fallbackToLlm', {
                      defaultValue:
                        'This instruction needs manual review and will fall back to AI assistance.',
                    })}
                  </Alert>

                  {clarificationOptions.length > 0 && (
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        {t('smartAssist.suggestions', {
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

              <SmartAssistActionRow>
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
                  disabled={isProcessing || isConfirming}
                >
                  {isProcessing || isConfirming
                    ? t('smartAssist.confirming')
                    : t('smartAssist.submit')}
                </SmartAssistPrimaryButton>
              </SmartAssistActionRow>
            </SmartAssistContent>
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
          {t('smartAssist.confirmationTitle', {
            defaultValue: 'Confirm Changes',
          })}
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
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
              : t('smartAssist.reject', { defaultValue: 'No' })}
          </SmartAssistSecondaryButton>

          <SmartAssistPrimaryButton
            variant="contained"
            startIcon={<Check />}
            onClick={() => handleConfirm()}
            disabled={isConfirming}
          >
            {isConfirming
              ? t('smartAssist.confirming')
              : isDeleteWarningConfirmation
                ? t('smartAssist.ok', { defaultValue: 'OK' })
                : t('smartAssist.approve', { defaultValue: 'Yes' })}
          </SmartAssistPrimaryButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SmartAssistModal;
