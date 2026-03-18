import { FC, useEffect, useState } from 'react';
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
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import CustomTextField from '../CustomTextField/CustomTextField';
import {
  CancelButton,
  ModalBox,
  ModalContainer,
} from '../Modal/EntityActionModal.styles';
import {
  useConfirmTextInstruction,
  useProcessTextInstruction,
} from '../../hooks/useTextProcessing';
import {
  SmartAddClarificationOption,
  SmartAddProcessPayload,
} from '../../types/textProcessing';
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

const getAlertSeverity = (
  response: ApiResponse<SmartAddProcessPayload> | null,
): 'success' | 'info' | 'warning' => {
  if (!response) {
    return 'info';
  }

  if (response.success) {
    return 'success';
  }

  return response.data?.fallbackToLLM ? 'warning' : 'info';
};

const SmartAddModal: FC<SmartAddModalProps> = ({ onClose, onSaved, open }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [processResponse, setProcessResponse] =
    useState<ApiResponse<SmartAddProcessPayload> | null>(null);
  const [persistResponse, setPersistResponse] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { mutateAsync: processInstruction, isPending: isProcessing } =
    useProcessTextInstruction();
  const { mutateAsync: confirmInstruction, isPending: isConfirming } =
    useConfirmTextInstruction();
  const clarificationOptions =
    processResponse?.data?.classified?.clarificationOptions ?? [];

  const confirmationMessage = processResponse?.data?.parsedData?.confirmation;
  const isDeleteWarningConfirmation = confirmationMessage?.startsWith(
    'Deletion is not supported.',
  );
  const requiresConfirmation = Boolean(
    processResponse?.success
      && processResponse.data?.parsedData
      && confirmationMessage,
  );
  const reviewMessage = confirmationMessage
    ?? t('smartAdd.confirmationFallbackShort', {
      defaultValue: 'Please review this action before saving.',
    });

  const formatRequestError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : t('smartAdd.requestFailed');

    // Nest 404 default for missing controller routes:
    // { message: 'Cannot POST /text-process', error: 'Not Found', statusCode: 404 }
    if (/Cannot\s+POST\s+\/text-process/i.test(message)) {
      return t('smartAdd.serviceUnavailable');
    }

    return message || t('smartAdd.requestFailed');
  };

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setProcessResponse(null);
      setPersistResponse(null);
      setRequestError(null);
    }
  }, [open]);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setProcessResponse(null);
    setPersistResponse(null);
    setRequestError(null);
  };

  const handleConfirm = async (
    processed = processResponse,
  ) => {
    const parsedData = processed?.data?.parsedData;
    if (!parsedData) {
      return;
    }

    try {
      const persistResult = await confirmInstruction(parsedData);
      if (!persistResult.success) {
        setPersistResponse(
          persistResult.message ?? t('smartAdd.requestFailed'),
        );
        return;
      }

      onSaved({
        message: persistResult.message ?? t('smartAdd.requestFailed'),
        warnings: persistResult.data?.warnings ?? [],
        reviewed: Boolean(processed?.data?.parsedData?.confirmation),
      });
      onClose();
    } catch (error) {
      setRequestError(formatRequestError(error));
      return;
    }
  };

  const submitPrompt = async (nextPrompt: string) => {
    if (!nextPrompt.trim()) {
      setRequestError(t('smartAdd.emptyPrompt'));
      return;
    }

    try {
      setPersistResponse(null);
      const processedResponse = await processInstruction(nextPrompt.trim());
      setProcessResponse(processedResponse);
      setPersistResponse(null);
      setRequestError(null);

      const parsedData = processedResponse.data?.parsedData;
      if (!processedResponse.success || !parsedData) {
        return;
      }

      const shouldConfirm = Boolean(
        processedResponse.data?.parsedData?.confirmation,
      );
      if (shouldConfirm) {
        return;
      }

      await handleConfirm(processedResponse);
    } catch (error) {
      setRequestError(formatRequestError(error));
      return;
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

              {processResponse && !processResponse.success && (
                <Stack spacing={1}>
                  <Alert severity={getAlertSeverity(processResponse)}>
                    {processResponse.message}
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

              {persistResponse && (
                <Alert severity="error">
                  {persistResponse}
                  {processResponse?.data?.parsedData ? (
                    <Typography variant="body2" sx={{ marginTop: 1 }}>
                      {processResponse.message}
                    </Typography>
                  ) : null}
                </Alert>
              )}

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
                  startIcon={<Check />}
                  onClick={handleSave}
                  disabled={isProcessing || isConfirming}
                >
                  {isProcessing || isConfirming
                    ? t('smartAdd.confirming')
                    : t('smartAdd.confirm')}
                </SmartAddPrimaryButton>
              </SmartAddActionRow>
            </SmartAddContent>
          </ModalBox>
        </ModalContainer>
      </Modal>

      <Dialog
        open={requiresConfirmation}
        onClose={() => setProcessResponse(null)}
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
            onClick={() => setProcessResponse(null)}
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
