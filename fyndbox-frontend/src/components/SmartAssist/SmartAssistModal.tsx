import { FC, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogProps,
  Dialog,
  DialogActions,
  DialogContent,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { Check, Close, NotesRounded, RateReviewRounded } from '@mui/icons-material';
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
  SmartAssistItem,
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
      <Dialog
        open={open}
        onClose={handleModalClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 5,
            overflow: 'hidden',
            backgroundImage: 'none',
            backgroundColor: '#fafcfa',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.22), 0 8px 24px rgba(0, 0, 0, 0.10)',
            margin: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            width: { xs: 'calc(100% - 32px)', sm: '100%' },
          },
        }}
      >
        {/* Gradient Header */}
        <Box
          sx={{
            background:
              'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
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
              <NotesRounded sx={{ color: '#fff', fontSize: 24 }} />
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
                {t('smartAdd.textTitle', { defaultValue: 'Smart Text Add' })}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.78)',
                  fontWeight: 400,
                  mt: 0.25,
                }}
              >
                {t('smartAdd.textSubtitle', {
                  defaultValue: 'Describe what you want to create using natural language',
                })}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: 2 }}>
          <Stack spacing={2}>
            <Stack
              sx={(theme) => ({
                borderRadius: 4,
                px: { xs: 1.5, sm: 2.25 },
                py: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(93, 157, 113, 0.04)',
                border: '1px solid rgba(93, 157, 113, 0.12)',
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
                minRows={4}
                onChange={(event) => handlePromptChange(event.target.value)}
              />
            </Stack>

            {requestError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {requestError}
              </Alert>
            )}

            {hasClarificationState && (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 3,
                  alignItems: 'flex-start',
                  backgroundColor: 'rgba(93, 157, 113, 0.07)',
                  border: '1px solid rgba(93, 157, 113, 0.15)',
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                          borderColor: 'rgba(93, 157, 113, 0.3)',
                          '&:hover': {
                            borderColor: 'rgba(93, 157, 113, 0.5)',
                            backgroundColor: 'rgba(93, 157, 113, 0.06)',
                          },
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            )}

            {persistError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {persistError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: 0.5 }}>
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
        </DialogActions>
      </Dialog>

      <Dialog
        open={requiresConfirmation}
        onClose={handleConfirmationDialogClose}
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
        <Box
          sx={{
            background:
              'linear-gradient(135deg, rgba(137, 183, 153, 0.98) 0%, rgba(93, 157, 113, 0.98) 52%, rgba(73, 139, 96, 0.98) 100%)',
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
              <RateReviewRounded sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              {t('smartAdd.confirmationTitle', {
                defaultValue: 'Confirm Changes',
              })}
            </Typography>
          </Stack>
        </Box>

        <DialogContent
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            pt: 2.5,
            pb: 1.5,
            maxHeight: '55vh',
            overflowY: 'auto',
          }}
        >
          {isDeleteWarningConfirmation ? (
            <Alert
              severity="warning"
              sx={{
                borderRadius: 3,
                backgroundColor: 'rgba(93, 157, 113, 0.07)',
                border: '1px solid rgba(93, 157, 113, 0.15)',
                '& .MuiAlert-message': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
              }}
            >
              {reviewMessage}
            </Alert>
          ) : processResult?.parsedData ? (
            <Stack spacing={0}>
              {/* Storage Node */}
              {processResult.parsedData.storageName && (
                <>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(93, 157, 113, 0.18) 0%, rgba(73, 139, 96, 0.12) 100%)',
                        border: '1.5px solid rgba(93, 157, 113, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: 16 }}>🏠</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(73, 139, 96, 0.7)', fontWeight: 500, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Storage
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {processResult.parsedData.storageName.charAt(0).toUpperCase() + processResult.parsedData.storageName.slice(1)}
                      </Typography>
                    </Box>
                  </Stack>
                  {(processResult.parsedData.boxes.length > 0 || processResult.parsedData.items.length > 0) && (
                    <Box sx={{ ml: '17px', borderLeft: '2px solid rgba(93, 157, 113, 0.2)', height: 20 }} />
                  )}
                </>
              )}

              {/* Box Nodes with nested Items */}
              {(() => {
                const boxes = processResult.parsedData?.boxes || [];
                const items = processResult.parsedData?.items || [];

                if (boxes.length === 0 && items.length === 0) {
                  return (
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: 3,
                        mt: 1,
                        backgroundColor: 'rgba(93, 157, 113, 0.07)',
                        border: '1px solid rgba(93, 157, 113, 0.15)',
                      }}
                    >
                      {reviewMessage}
                    </Alert>
                  );
                }

                const boxList = boxes.length > 0
                  ? boxes
                  : [{ clientRef: '__default__', name: processResult.parsedData?.boxName || 'Default' }];

                return boxList.map((box: any, bIdx: number) => {
                  const boxItems = items.filter(
                    (it: SmartAssistItem) =>
                      it.boxClientRef === box.clientRef ||
                      (boxes.length === 0)
                  );

                  return (
                    <Box key={bIdx}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                          ml: processResult.parsedData?.storageName ? '17px' : 0,
                          pl: processResult.parsedData?.storageName ? 2 : 0,
                          position: 'relative',
                          ...(processResult.parsedData?.storageName && {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              width: 16,
                              height: 2,
                              backgroundColor: 'rgba(93, 157, 113, 0.2)',
                            },
                          }),
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(93, 157, 113, 0.12) 0%, rgba(137, 183, 153, 0.08) 100%)',
                            border: '1.5px solid rgba(93, 157, 113, 0.18)',
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: 14 }}>📦</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(73, 139, 96, 0.6)', fontWeight: 500, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Box{box.quantity && box.quantity > 1 ? ` ×${box.quantity}` : ''}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {box.name.charAt(0).toUpperCase() + box.name.slice(1)}
                          </Typography>
                        </Box>
                      </Stack>

                      {boxItems.length > 0 && (
                        <Stack
                          sx={{
                            ml: processResult.parsedData?.storageName
                              ? 'calc(17px + 16px + 15px)'
                              : 'calc(16px + 15px)',
                            mt: 0.5,
                            mb: 1,
                          }}
                          spacing={0}
                        >
                          {boxItems.map((item: SmartAssistItem, iIdx: number) => (
                            <Box key={iIdx}>
                              <Box sx={{ ml: '1px', borderLeft: '2px solid rgba(93, 157, 113, 0.15)', height: 10 }} />
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                                sx={{
                                  pl: 2,
                                  py: 0.75,
                                  pr: 1.5,
                                  position: 'relative',
                                  borderRadius: 2.5,
                                  backgroundColor: 'rgba(93, 157, 113, 0.04)',
                                  border: '1px solid rgba(93, 157, 113, 0.08)',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    width: 12,
                                    height: 2,
                                    backgroundColor: 'rgba(93, 157, 113, 0.15)',
                                    ml: '-14px',
                                  },
                                }}
                              >
                                <Typography sx={{ fontSize: 13 }}>🏷️</Typography>
                                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                  {item.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'rgba(73, 139, 96, 0.8)',
                                    backgroundColor: 'rgba(93, 157, 113, 0.1)',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1.5,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  ×{item.quantity}
                                </Typography>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  );
                });
              })()}
            </Stack>
          ) : (
            <Alert
              severity="info"
              sx={{
                borderRadius: 3,
                backgroundColor: 'rgba(93, 157, 113, 0.07)',
                border: '1px solid rgba(93, 157, 113, 0.15)',
                '& .MuiAlert-message': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
              }}
            >
              {reviewMessage}
            </Alert>
          )}
        </DialogContent>

        <DialogActions
          sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: 0.5 }}
        >
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
