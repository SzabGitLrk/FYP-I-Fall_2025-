import { FC, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Check, Close, CloudUpload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  CancelButton,
  ModalBox,
  ModalContainer,
} from '../Modal/EntityActionModal.styles';
import { useProcessImageInput, useConfirmAiResult } from '../../hooks/useAi';
import {
  ConfirmAiResultRequest,
  ProcessTextResult,
  SmartAssistItem,
} from '../../types/ai';
import {
  SmartAssistContent,
  SmartAssistPrimaryButton,
  SmartAssistSecondaryButton,
} from './SmartAssistModal.styles';

interface SmartAssistImageModalProps {
  onClose: () => void;
  onSaved: (result: {
    message: string;
    warnings?: string[];
    reviewed?: boolean;
  }) => void;
  open: boolean;
}

const SmartAssistImageModal: FC<SmartAssistImageModalProps> = ({
  onClose,
  onSaved,
  open,
}) => {
  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<ProcessTextResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: processImage, isPending: isProcessing } = useProcessImageInput();
  const { mutateAsync: confirmAiResult, isPending: isConfirming } = useConfirmAiResult();

  useEffect(() => {
    if (!open) {
      setSelectedImage(null);
      setPreviewUrl(null);
      setProcessResult(null);
      setRequestError(null);
      setPersistError(null);
    }
  }, [open]);

  const confirmationMessage = processResult?.parsedData?.confirmation;
  const requiresReview = Boolean(processResult?.parsedData);

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
            defaultValue: 'Unable to process the image right now.',
          });
    return message;
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                reject(new Error('Canvas to Blob failed'));
              }
            },
            'image/webp',
            0.8
          );
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setRequestError('Please select a valid image file.');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRequestError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setRequestError('Please drop a valid image file.');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRequestError(null);
    }
  };

  const handleConfirm = async (resultToConfirm = processResult) => {
    const parsedData = resultToConfirm?.parsedData;
    if (!parsedData) return;

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

  const submitImage = async () => {
    if (!selectedImage) return;

    try {
      setRequestError(null);
      setPersistError(null);

      const compressedFile = await compressImage(selectedImage);
      const processed = await processImage(compressedFile);
      setProcessResult(processed);

      if (!processed.parsedData) {
        return;
      }
    } catch (error) {
      setRequestError(formatRequestError(error));
    }
  };

  const handleModalClose = () => {
    if (requiresReview || isProcessing) return;
    onClose();
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
            <CancelButton onClick={handleModalClose} disabled={isProcessing}>
              <Close />
            </CancelButton>

            <SmartAssistContent sx={{ gap: 1.25, paddingTop: 2.25 }}>
              <Typography variant="h4" sx={{ mb: 0 }}>
                {t('smartAdd.imageTitle', { defaultValue: 'Smart Image Add' })}
              </Typography>

              {!selectedImage ? (
                <Box
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  sx={{
                    border: '2px dashed',
                    borderColor: 'rgba(122, 167, 224, 0.55)',
                    borderRadius: 4,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 3, sm: 3.5 },
                    textAlign: 'center',
                    cursor: 'pointer',
                    background:
                      'linear-gradient(180deg, rgba(236,244,255,0.62) 0%, rgba(255,255,255,0.94) 100%)',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload
                    sx={{ fontSize: 40, color: 'primary.main', mb: 1.25 }}
                  />
                  <Typography variant="body1" fontWeight={700} gutterBottom>
                    Drop your image here, or browse
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supports JPG, PNG, WEBP
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    mb: 1,
                    position: 'relative',
                    width: 'fit-content',
                    mx: 'auto',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      setProcessResult(null);
                      setRequestError(null);
                    }}
                    disabled={isProcessing}
                    sx={(theme) => ({
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      width: 32,
                      height: 32,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)',
                      },
                    })}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                  <img
                    src={previewUrl!}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '220px',
                      borderRadius: '14px',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}

              {requestError && <Alert severity="error" sx={{ mt: 2 }}>{requestError}</Alert>}
              {persistError && <Alert severity="error" sx={{ mt: 2 }}>{persistError}</Alert>}

              {isProcessing && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography>Analyzing image and mapping to your inventory...</Typography>
                </Stack>
              )}

              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <SmartAssistSecondaryButton
                  variant="outlined"
                  onClick={onClose}
                  disabled={isProcessing || isConfirming}
                >
                  {t('modal.cancel', { defaultValue: 'Cancel' })}
                </SmartAssistSecondaryButton>

                <SmartAssistPrimaryButton
                  variant="contained"
                  onClick={submitImage}
                  disabled={!selectedImage || isProcessing || isConfirming}
                >
                  {isProcessing
                    ? t('smartAdd.processing', { defaultValue: 'Processing...' })
                    : t('smartAdd.analyze', { defaultValue: 'Analyze Image' })}
                </SmartAssistPrimaryButton>
              </Box>
            </SmartAssistContent>
          </ModalBox>
        </ModalContainer>
      </Modal>

      <Dialog
        open={requiresReview}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {processResult?.parsedData?.items?.length
            ? t('smartAdd.reviewItemsTitle', {
                defaultValue: 'Review Detected Items',
              })
            : t('smartAdd.confirmationTitle', {
                defaultValue: 'Confirm Changes',
              })}
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <Alert severity="info" sx={{ borderRadius: 2, '& .MuiAlert-message': { whiteSpace: 'pre-wrap' } }}>
            {reviewMessage}
          </Alert>

          {processResult?.parsedData?.items && processResult.parsedData.items.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Detected Items (Update Quantities)
              </Typography>
              {processResult.parsedData.items.map((item: SmartAssistItem, index: number) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 2 }}>
                  <Typography sx={{ flex: 1, fontWeight: 500 }}>{item.name}</Typography>
                  <TextField
                    type="number"
                    size="small"
                    label="Quantity"
                    value={item.quantity || 1}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value, 10);
                      setProcessResult((prev) => {
                        if (!prev?.parsedData) return prev;
                        const newItems = [...prev.parsedData.items];
                        newItems[index] = { ...newItems[index], quantity: isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity };
                        return {
                          ...prev,
                          parsedData: {
                            ...prev.parsedData,
                            items: newItems,
                          },
                        };
                      });
                    }}
                    inputProps={{ min: 1 }}
                    sx={{ width: '100px' }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {previewUrl && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reference Image
              </Typography>
              <img
                src={previewUrl}
                alt="Reference"
                style={{ maxWidth: '200px', borderRadius: '4px' }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ padding: 2 }}>
          <SmartAssistSecondaryButton
            variant="outlined"
            onClick={() => setProcessResult(null)}
            disabled={isConfirming}
          >
            {t('smartAdd.reject', { defaultValue: 'No' })}
          </SmartAssistSecondaryButton>

          <SmartAssistPrimaryButton
            variant="contained"
            startIcon={<Check />}
            onClick={() => handleConfirm()}
            disabled={isConfirming}
          >
            {isConfirming
              ? t('smartAdd.confirming', { defaultValue: 'Saving...' })
              : t('smartAdd.saveItems', { defaultValue: 'Save Items' })}
          </SmartAssistPrimaryButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SmartAssistImageModal;
