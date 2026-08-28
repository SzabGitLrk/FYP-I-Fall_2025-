import { FC, useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import { Check, Close, CloudUploadRounded, ImageSearchRounded, RateReviewRounded, PhotoCameraRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useProcessImageInput, useConfirmAiResult } from '../../hooks/useAi';
import {
  ConfirmAiResultRequest,
  ProcessTextResult,
  SmartAssistItem,
} from '../../types/ai';
import {
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { mutateAsync: processImage, isPending: isProcessing } = useProcessImageInput();
  const { mutateAsync: confirmAiResult, isPending: isConfirming } = useConfirmAiResult();

  const [uploadProgress, setUploadProgress] = useState(0);

  // Define stopCamera first so it can be used in useEffect
  const stopCamera = useCallback(() => {
    console.log('stopCamera called');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
    setCameraError(null);
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up camera');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Assign stream to video element when camera becomes active
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      console.log('Assigning stream to visible video element');
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Simulated progress that advances through 3 stages
  useEffect(() => {
    if (!isProcessing) {
      setUploadProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 30) return prev + Math.random() * 3 + 1;
        if (prev < 60) return prev + Math.random() * 2 + 0.5;
        if (prev < 92) return prev + Math.random() * 1.2 + 0.3;
        return prev; // stall at ~92 until real completion
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (!open) {
      console.log('Modal closed, cleaning up...');
      setSelectedImage(null);
      setPreviewUrl(null);
      setProcessResult(null);
      setRequestError(null);
      setPersistError(null);
      stopCamera();
    }
  }, [open, stopCamera]);

  const requiresReview = Boolean(processResult?.parsedData);

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

  const startCamera = useCallback(async () => {
    console.log('=== startCamera function called ===');
    console.log('Current URL:', window.location.href);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    
    setIsCameraLoading(true);
    setCameraError(null);
    
    try {
      // Check if we're on localhost or HTTPS
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      
      if (!isLocalhost && !isHttps) {
        const errorMsg = `Camera requires HTTPS or localhost. Current URL: ${window.location.protocol}//${window.location.hostname}. Please use localhost instead of IP address.`;
        console.error(errorMsg);
        setCameraError(errorMsg);
        setIsCameraLoading(false);
        return;
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.';
        console.error(errorMsg);
        setCameraError(errorMsg);
        setIsCameraLoading(false);
        return;
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      console.log('Camera access granted, stream:', stream);
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks());
      
      // Store stream in ref - will be assigned to video element by useEffect
      streamRef.current = stream;
      console.log('Stream stored in streamRef');
      
      // Set camera active - this will trigger useEffect to assign stream to video
      setIsCameraActive(true);
      setIsCameraLoading(false);
      console.log('=== Camera setup complete ===');
      
    } catch (error) {
      console.error('=== Camera error ===', error);
      setIsCameraLoading(false);
      let errorMessage = 'Unable to access camera';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera device found on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera access requires HTTPS. Please access the site via HTTPS.';
        } else {
          errorMessage = error.message;
        }
      }
      setCameraError(errorMessage);
      console.error('Final error message:', errorMessage);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    console.log('capturePhoto called');
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      console.log('Video ready state:', videoRef.current.readyState);
      
      if (context && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            console.log('Photo captured, blob size:', blob.size);
            const file = new File([blob], 'camera-capture.webp', {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            setSelectedImage(file);
            const previewDataUrl = canvasRef.current!.toDataURL('image/webp');
            setPreviewUrl(previewDataUrl);
            stopCamera();
            setRequestError(null);
            setPersistError(null);

            // Auto-analyze the captured image
            try {
              console.log('Auto-analyzing captured image...');
              const compressedFile = await compressImage(file);
              const processed = await processImage(compressedFile);
              setProcessResult(processed);

              if (!processed.parsedData) {
                console.log('No parsed data returned');
                return;
              }
              console.log('Image processed successfully');
            } catch (error) {
              console.error('Error processing captured image:', error);
              setRequestError(formatRequestError(error));
            }
          }
        }, 'image/webp', 0.8);
      } else {
        setCameraError('Camera is not ready. Please wait a moment and try again.');
      }
    }
  }, [processImage, stopCamera]);

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
              <ImageSearchRounded sx={{ color: '#fff', fontSize: 24 }} />
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
                {t('smartAdd.imageTitle', { defaultValue: 'Smart Image Add' })}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.78)',
                  fontWeight: 400,
                  mt: 0.25,
                }}
              >
                {t('smartAdd.imageSubtitle', {
                  defaultValue: 'Upload a photo and let AI detect items automatically',
                })}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 2.5, pb: 1.5 }}>
          {/* Hidden canvas element - always rendered so ref is available */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <Stack spacing={2}>
            {!selectedImage ? (
              <>
                {!isCameraActive ? (
                  <Stack spacing={2}>
                    {/* Upload Option */}
                    <Box
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      sx={{
                        border: '2px dashed',
                        borderColor: 'rgba(93, 157, 113, 0.35)',
                        borderRadius: 4,
                        px: { xs: 2, sm: 3 },
                        py: { xs: 4, sm: 5 },
                        textAlign: 'center',
                        cursor: 'pointer',
                        background:
                          'linear-gradient(180deg, rgba(93, 157, 113, 0.05) 0%, rgba(255,255,255,0.96) 100%)',
                        transition: 'all 200ms ease',
                        '&:hover': {
                          borderColor: 'rgba(93, 157, 113, 0.55)',
                          backgroundColor: 'rgba(93, 157, 113, 0.04)',
                        },
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, rgba(93, 157, 113, 0.15) 0%, rgba(73, 139, 96, 0.10) 100%)',
                          mx: 'auto',
                          mb: 1.5,
                        }}
                      >
                        <CloudUploadRounded
                          sx={{ fontSize: 28, color: 'rgba(73, 139, 96, 0.8)' }}
                        />
                      </Box>
                      <Typography variant="body1" fontWeight={700} gutterBottom>
                        {t('smartAdd.dropTitle', { defaultValue: 'Drop your image here, or browse' })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {t('smartAdd.dropFormats', { defaultValue: 'Supports JPG, PNG, WEBP' })}
                      </Typography>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                    </Box>

                    {/* Divider */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1, height: '1px', backgroundColor: 'rgba(93, 157, 113, 0.15)' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t('smartAdd.or', { defaultValue: 'OR' })}
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', backgroundColor: 'rgba(93, 157, 113, 0.15)' }} />
                    </Box>

                    {/* Camera Option */}
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraRounded />}
                      onClick={async () => {
                        console.log('=== Click Image button clicked ===');
                        console.log('isProcessing:', isProcessing);
                        console.log('isCameraLoading:', isCameraLoading);
                        console.log('isCameraActive:', isCameraActive);
                        try {
                          await startCamera();
                        } catch (err) {
                          console.error('Error in button onClick:', err);
                        }
                      }}
                      disabled={isProcessing || isCameraLoading}
                      sx={{
                        py: 2,
                        borderColor: 'rgba(93, 157, 113, 0.35)',
                        color: 'rgba(73, 139, 96, 0.9)',
                        fontWeight: 600,
                        borderRadius: 3,
                        transition: 'all 200ms ease',
                        '&:hover': {
                          borderColor: 'rgba(93, 157, 113, 0.55)',
                          backgroundColor: 'rgba(93, 157, 113, 0.04)',
                        },
                      }}
                    >
                      {isCameraLoading 
                        ? t('smartAdd.openingCamera', { defaultValue: 'Opening Camera...' })
                        : t('smartAdd.capturePhoto', { defaultValue: 'Click Image' })
                      }
                    </Button>

                    {/* Show camera error when not in camera view */}
                    {cameraError && !isCameraActive && (
                      <Alert severity="error" sx={{ borderRadius: 3 }}>
                        {cameraError}
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  /* Camera View */
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 4,
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        aspectRatio: '4/3',
                        border: '2px solid rgba(93, 157, 113, 0.2)',
                      }}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>

                    {cameraError && (
                      <Alert severity="error" sx={{ borderRadius: 3 }}>
                        {cameraError}
                      </Alert>
                    )}

                    <Stack direction="row" spacing={1.5}>
                      <Button
                        variant="outlined"
                        onClick={stopCamera}
                        sx={{
                          flex: 1,
                          borderColor: 'error.main',
                          color: 'error.main',
                          fontWeight: 600,
                          borderRadius: 3,
                          '&:hover': {
                            borderColor: 'error.dark',
                            color: 'error.dark',
                            backgroundColor: 'rgba(175, 87, 87, 0.08)',
                          },
                        }}
                      >
                        {t('modal.cancel', { defaultValue: 'Cancel' })}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={capturePhoto}
                        sx={{
                          flex: 1,
                          background: 'linear-gradient(135deg, rgba(137, 183, 153, 0.95) 0%, rgba(93, 157, 113, 0.95) 52%, rgba(73, 139, 96, 0.95) 100%)',
                          fontWeight: 600,
                          borderRadius: 3,
                          '&:hover': {
                            background: 'linear-gradient(135deg, rgba(137, 183, 153, 1) 0%, rgba(93, 157, 113, 1) 52%, rgba(73, 139, 96, 1) 100%)',
                          },
                        }}
                      >
                        {t('smartAdd.capture', { defaultValue: 'Capture' })}
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  position: 'relative',
                  width: 'fit-content',
                  mx: 'auto',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid rgba(93, 157, 113, 0.12)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
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
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(93, 157, 113, 0.15)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.10)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                    },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
                <img
                  src={previewUrl!}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '260px',
                    borderRadius: '14px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </Box>
            )}

            {requestError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {requestError}
              </Alert>
            )}
            {persistError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {persistError}
              </Alert>
            )}

            {isProcessing && (
              <Stack
                spacing={1.5}
                sx={{
                  py: 2,
                  px: 2.5,
                  borderRadius: 3,
                  backgroundColor: 'rgba(93, 157, 113, 0.05)',
                  border: '1px solid rgba(93, 157, 113, 0.12)',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'rgba(73, 139, 96, 0.9)',
                    }}
                  >
                    {uploadProgress < 30
                      ? t('smartAdd.stepDetect', { defaultValue: 'Detecting items...' })
                      : uploadProgress < 60
                        ? t('smartAdd.stepMapping', { defaultValue: 'Mapping inventory...' })
                        : t('smartAdd.stepPreparing', { defaultValue: 'Preparing results...' })}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: 'rgba(73, 139, 96, 0.85)',
                      minWidth: 36,
                      textAlign: 'right',
                    }}
                  >
                    {Math.min(Math.round(uploadProgress), 99)}%
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(uploadProgress, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(93, 157, 113, 0.12)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background:
                        'linear-gradient(90deg, rgba(137, 183, 153, 0.9) 0%, rgba(93, 157, 113, 0.95) 50%, rgba(73, 139, 96, 0.9) 100%)',
                      transition: 'transform 0.3s ease',
                    },
                  }}
                />

                <Stack direction="row" spacing={0} justifyContent="space-between">
                  {[
                    { label: t('smartAdd.stepDetectShort', { defaultValue: 'Detecting' }), threshold: 0 },
                    { label: t('smartAdd.stepMappingShort', { defaultValue: 'Mapping' }), threshold: 30 },
                    { label: t('smartAdd.stepPreparingShort', { defaultValue: 'Preparing' }), threshold: 60 },
                  ].map((step, i) => {
                    const isActive = uploadProgress >= step.threshold && (i === 2 || uploadProgress < [30, 60, 100][i]);
                    const isDone = i < 2 && uploadProgress >= [30, 60, 100][i];
                    return (
                      <Typography
                        key={i}
                        variant="caption"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive
                            ? 'rgba(73, 139, 96, 0.9)'
                            : isDone
                              ? 'rgba(73, 139, 96, 0.6)'
                              : 'rgba(73, 139, 96, 0.35)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {isDone ? '✓ ' : ''}{step.label}
                      </Typography>
                    );
                  })}
                </Stack>
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: 0.5 }}>
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
            sx={{
              whiteSpace: 'nowrap',
              [theme => theme.breakpoints.down('sm')]: {
                minWidth: 'auto',
                fontSize: '0.8125rem',
              },
            }}
          >
            {isProcessing
              ? t('smartAdd.processing', { defaultValue: 'Processing...' })
              : t('smartAdd.analyze', { defaultValue: 'Analyze' })}
          </SmartAssistPrimaryButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={requiresReview}
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
              {processResult?.parsedData?.items?.length
                ? t('smartAdd.reviewItemsTitle', {
                  defaultValue: 'Review Detected Items',
                })
                : t('smartAdd.confirmationTitle', {
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
          {/* Visual Tree Diagram */}
          <Stack spacing={0}>
            {/* Storage Node */}
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
                  {processResult?.parsedData?.storageName
                    ? processResult.parsedData.storageName.charAt(0).toUpperCase() + processResult.parsedData.storageName.slice(1)
                    : 'Unknown'}
                </Typography>
              </Box>
            </Stack>

            {/* Connector line Storage → Box */}
            <Box sx={{ ml: '17px', borderLeft: '2px solid rgba(93, 157, 113, 0.2)', height: 20 }} />

            {/* Box Nodes */}
            {(() => {
              const boxes = processResult?.parsedData?.boxes || [];
              const items = processResult?.parsedData?.items || [];
              const boxList = boxes.length > 0
                ? boxes
                : [{ clientRef: '__default__', name: processResult?.parsedData?.boxName || 'Default' }];

              return boxList.map((box: any, bIdx: number) => {
                const boxItems = items.filter(
                  (it: SmartAssistItem) =>
                    it.boxClientRef === box.clientRef ||
                    (boxes.length === 0)
                );

                return (
                  <Box key={bIdx}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ml: '17px', pl: 2, position: 'relative', '&::before': { content: '""', position: 'absolute', left: 0, top: '50%', width: 16, height: 2, backgroundColor: 'rgba(93, 157, 113, 0.2)' } }}>
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
                          Box
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {box.name.charAt(0).toUpperCase() + box.name.slice(1)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Items inside this box */}
                    {boxItems.length > 0 && (
                      <Stack sx={{ ml: 'calc(17px + 16px + 15px)', mt: 0.5, mb: 1 }} spacing={0}>
                        {boxItems.map((item: SmartAssistItem, iIdx: number) => {
                          const globalIndex = items.indexOf(item);
                          return (
                            <Box key={iIdx}>
                              {/* Connector line */}
                              <Box sx={{ ml: '1px', borderLeft: '2px solid rgba(93, 157, 113, 0.15)', height: 10 }} />
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                                sx={{
                                  pl: 2,
                                  py: 0.75,
                                  pr: 1,
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
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.quantity || 1}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value, 10);
                                    setProcessResult((prev) => {
                                      if (!prev?.parsedData) return prev;
                                      const newItems = [...prev.parsedData.items];
                                      newItems[globalIndex] = {
                                        ...newItems[globalIndex],
                                        quantity: isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity,
                                      };
                                      return {
                                        ...prev,
                                        parsedData: { ...prev.parsedData, items: newItems },
                                      };
                                    });
                                  }}
                                  inputProps={{ min: 1 }}
                                  sx={{
                                    width: '72px',
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: 2,
                                      height: 34,
                                      backgroundColor: '#fff',
                                      '& fieldset': {
                                        borderColor: 'rgba(93, 157, 113, 0.2)',
                                      },
                                      '&:hover fieldset': {
                                        borderColor: 'rgba(93, 157, 113, 0.4)',
                                      },
                                    },
                                    '& .MuiOutlinedInput-input': {
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      fontSize: '0.85rem',
                                      py: 0.5,
                                    },
                                  }}
                                />
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                );
              });
            })()}
          </Stack>

          {previewUrl && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reference Image
              </Typography>
              <img
                src={previewUrl}
                alt="Reference"
                style={{ maxWidth: '200px', borderRadius: '12px' }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: 0.5 }}>
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
