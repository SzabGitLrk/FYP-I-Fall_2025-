import { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
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
import {
  Check,
  Close,
  GraphicEqRounded,
  KeyboardVoiceRounded,
  ReplayRounded,
  StopRounded,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import CustomTextField from '../CustomTextField/CustomTextField';
import {
  CancelButton,
  ModalBox,
  ModalContainer,
} from '../Modal/EntityActionModal.styles';
import {
  useConfirmAiResult,
  useProcessTextInput,
  useProcessVoiceInput,
} from '../../hooks/useAi';
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

interface BrowserSpeechRecognitionResultLike {
  0: {
    transcript: string;
  };
  isFinal: boolean;
}

interface BrowserSpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognitionErrorEventLike {
  error: string;
}

interface BrowserSpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEventLike) => void) | null;
  onresult:
    | ((event: BrowserSpeechRecognitionEventLike) => void)
    | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognitionLike;
}

interface SmartAssistVoiceModalProps {
  onClose: () => void;
  onSaved: (result: {
    message: string;
    warnings?: string[];
    reviewed?: boolean;
  }) => void;
  open: boolean;
}

const MAX_RECORDING_SECONDS = 60;
const MAX_RECORDING_MS = MAX_RECORDING_SECONDS * 1000;
const AUTO_STOP_SILENCE_MS = 5000;
const LIVE_TRANSCRIPTION_INTERVAL_MS = 2200;
const AUDIO_CHUNK_TIMESLICE_MS = 1000;

const getSpeechRecognitionConstructor =
  (): BrowserSpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };

    return (
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition ||
      null
    );
  };

const getRecognitionLanguage = (language: string): string => {
  if (language.startsWith('sv')) {
    return 'sv-SE';
  }

  if (language.startsWith('en')) {
    return 'en-US';
  }

  return navigator.language || 'en-US';
};

const sanitizeVoiceTranscriptPreview = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

// Keep the processing transcript lightweight and text-pipeline friendly at submit time.
const normalizeVoiceTranscriptForProcessing = (value: string): string => {
  let result = value.replace(/\s+/g, ' ').trim();

  result = result.replace(/\b(?:uh|um|ah|er|hmm)\b/gi, ' ');
  result = result.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  const replacements: Array<[RegExp, string]> = [
    [/\bname the\b/gi, 'named'],
    [/\bin which\b/gi, 'with'],
    [/\bin each of (?:these|those)\b/gi, 'in each'],
    [/\beach of (?:these|those)\b/gi, 'each'],
    [
      /\baid\b(?=\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\b)/gi,
      'add',
    ],
  ];

  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });

  return result.replace(/\s+/g, ' ').trim();
};

const getPreferredRecordingMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const candidateMimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  return (
    candidateMimeTypes.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    ) || 'audio/webm'
  );
};

const SmartAssistVoiceModal: FC<SmartAssistVoiceModalProps> = ({
  onClose,
  onSaved,
  open,
}) => {
  const { t, i18n } = useTranslation();
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [processResult, setProcessResult] = useState<ProcessTextResult | null>(
    null,
  );
  const [requestError, setRequestError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const liveTranscriptionTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastMicLevelSampleAtRef = useRef(0);
  const latestTranscriptRef = useRef('');
  const hasDetectedSpeechRef = useRef(false);
  const shouldFinalizeCaptureRef = useRef(false);
  const shouldKeepBrowserRecognitionRef = useRef(false);
  const isLiveTranscriptionInFlightRef = useRef(false);
  const backendTranscriptionUnavailableRef = useRef(false);
  const captureSessionIdRef = useRef(0);
  const lastTranscribedChunkCountRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const browserTranscriptBufferRef = useRef('');
  const recordingMimeTypeRef = useRef('audio/webm');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const supportsVoiceCapture = Boolean(
    typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      typeof MediaRecorder !== 'undefined',
  );
  const supportsBrowserRecognition = Boolean(getSpeechRecognitionConstructor());
  const { mutateAsync: processText, isPending: isProcessingText } =
    useProcessTextInput();
  const { mutateAsync: processVoice, isPending: isTranscribingMutation } =
    useProcessVoiceInput();
  const { mutateAsync: confirmAiResult, isPending: isConfirming } =
    useConfirmAiResult();
  const isProcessing = isProcessingText || isTranscribingVoice || isTranscribingMutation;

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
    t('smartAdd.confirmationFallbackShort', {
      defaultValue: 'Please review this action before saving.',
    });

  const clearFeedback = () => {
    setPersistError(null);
    setRequestError(null);
  };

  const clearRecordingTimers = () => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (liveTranscriptionTimeoutRef.current !== null) {
      window.clearTimeout(liveTranscriptionTimeoutRef.current);
      liveTranscriptionTimeoutRef.current = null;
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      audioSourceRef.current?.disconnect();
    } catch {
      // Ignore Web Audio cleanup errors during modal teardown.
    }

    try {
      analyserRef.current?.disconnect();
    } catch {
      // Ignore Web Audio cleanup errors during modal teardown.
    }

    audioSourceRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    lastMicLevelSampleAtRef.current = 0;
    setMicLevel(0);
  };

  const resetCaptureState = () => {
    setIsPreparingRecording(false);
    setIsRecording(false);
    setIsTranscribingVoice(false);
    setMicLevel(0);
    latestTranscriptRef.current = '';
    browserTranscriptBufferRef.current = '';
    hasDetectedSpeechRef.current = false;
    shouldFinalizeCaptureRef.current = false;
    shouldKeepBrowserRecognitionRef.current = false;
    isLiveTranscriptionInFlightRef.current = false;
    backendTranscriptionUnavailableRef.current = false;
    lastTranscribedChunkCountRef.current = 0;
    audioChunksRef.current = [];
    recordingMimeTypeRef.current = 'audio/webm';
  };

  const resetModalState = () => {
    resetCaptureState();
    setTranscript('');
    setProcessResult(null);
    setRequestError(null);
    setPersistError(null);
  };

  const formatRequestError = (error: unknown): string => {
    const message =
      error instanceof Error
        ? error.message
        : t('smartAdd.requestFailed', {
            defaultValue: 'Unable to process the instruction right now.',
          });

    if (/Cannot\s+POST\s+\/ai\/process-text/i.test(message)) {
      return t('smartAdd.serviceUnavailable', {
        defaultValue:
          "Smart Add service isn't available right now. Please restart the backend and try again.",
      });
    }

    if (/Cannot\s+POST\s+\/ai\/transcribe-voice/i.test(message)) {
      return t('smartAdd.voiceServiceUnavailable', {
        defaultValue:
          "Voice transcription isn't available right now. Please restart the backend and try again.",
      });
    }

    if (/^Not Found$/i.test(message.trim())) {
      return t('smartAdd.voiceServiceUnavailable', {
        defaultValue:
          "Voice transcription isn't available right now. Please restart the backend and try again.",
      });
    }

    return (
      message ||
      t('smartAdd.requestFailed', {
        defaultValue: 'Unable to process the instruction right now.',
      })
    );
  };

  const buildRecordedAudioFile = (): File | null => {
    if (audioChunksRef.current.length === 0) {
      return null;
    }

    return new File(audioChunksRef.current, 'voice-command.webm', {
      type: recordingMimeTypeRef.current || 'audio/webm',
      lastModified: Date.now(),
    });
  };

  const isBackendTranscriptionUnavailableError = (error: unknown): boolean => {
    const message =
      error instanceof Error ? error.message.trim() : String(error || '').trim();

    return (
      /Voice transcription is not configured/i.test(message) ||
      /Voice transcription isn't available/i.test(message) ||
      /Cannot\s+POST\s+\/ai\/transcribe-voice/i.test(message) ||
      /^Not Found$/i.test(message)
    );
  };

  const getBrowserFallbackTranscript = (): string => {
    return sanitizeVoiceTranscriptPreview(
      latestTranscriptRef.current || browserTranscriptBufferRef.current,
    );
  };

  const scheduleSilenceTimeout = () => {
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current);
    }

    silenceTimeoutRef.current = window.setTimeout(() => {
      stopRecording(true);
    }, AUTO_STOP_SILENCE_MS);
  };

  const stopBrowserRecognition = (abort = false) => {
    shouldKeepBrowserRecognitionRef.current = false;

    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    if (!recognition) {
      return;
    }

    try {
      if (abort) {
        recognition.abort();
      } else {
        recognition.stop();
      }
    } catch {
      // Ignore browser speech cleanup issues when the recorder closes quickly.
    }
  };

  const startBrowserRecognition = () => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      return;
    }

    stopBrowserRecognition(true);
    shouldKeepBrowserRecognitionRef.current = true;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getRecognitionLanguage(i18n.language || 'en');

    recognitionRef.current = recognition;

    recognition.onaudiostart = () => {
      hasDetectedSpeechRef.current = true;
    };

    recognition.onsoundstart = () => {
      hasDetectedSpeechRef.current = true;
    };

    recognition.onspeechstart = () => {
      hasDetectedSpeechRef.current = true;
    };

    recognition.onspeechend = () => {
      if (hasDetectedSpeechRef.current) {
        scheduleSilenceTimeout();
      }
    };

    recognition.onresult = (event) => {
      let finalizedText = browserTranscriptBufferRef.current;
      const interimParts: string[] = [];

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const spokenText = result?.[0]?.transcript?.trim() || '';

        if (!spokenText) {
          continue;
        }

        if (result.isFinal) {
          finalizedText = `${finalizedText} ${spokenText}`.trim();
        } else {
          interimParts.push(spokenText);
        }
      }

      browserTranscriptBufferRef.current = finalizedText;

      const previewTranscript = sanitizeVoiceTranscriptPreview(
        `${finalizedText} ${interimParts.join(' ')}`.trim(),
      );

      if (previewTranscript.length > 0) {
        latestTranscriptRef.current = previewTranscript;
        setTranscript(previewTranscript);
        hasDetectedSpeechRef.current = true;
      }

      scheduleSilenceTimeout();
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (
        shouldKeepBrowserRecognitionRef.current &&
        mediaRecorderRef.current?.state === 'recording'
      ) {
        window.setTimeout(() => {
          if (
            shouldKeepBrowserRecognitionRef.current &&
            !recognitionRef.current &&
            mediaRecorderRef.current?.state === 'recording'
          ) {
            startBrowserRecognition();
          }
        }, 150);
      }
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  };

  const transcribeCapturedAudio = async (
    sessionId: number,
    force = false,
  ): Promise<string> => {
    if (backendTranscriptionUnavailableRef.current) {
      return getBrowserFallbackTranscript();
    }

    if (!force && isLiveTranscriptionInFlightRef.current) {
      return latestTranscriptRef.current;
    }

    if (
      !force &&
      audioChunksRef.current.length > 0 &&
      audioChunksRef.current.length === lastTranscribedChunkCountRef.current
    ) {
      return latestTranscriptRef.current;
    }

    const recordedFile = buildRecordedAudioFile();
    if (!recordedFile) {
      return '';
    }

    isLiveTranscriptionInFlightRef.current = true;
    setIsTranscribingVoice(true);

    try {
      const result = await processVoice(recordedFile);
      const nextTranscript = sanitizeVoiceTranscriptPreview(result.transcript);

      lastTranscribedChunkCountRef.current = audioChunksRef.current.length;

      if (sessionId === captureSessionIdRef.current) {
        latestTranscriptRef.current = nextTranscript;
        setTranscript(nextTranscript);
      }

      return nextTranscript;
    } catch (error) {
      if (
        isBackendTranscriptionUnavailableError(error) &&
        supportsBrowserRecognition
      ) {
        backendTranscriptionUnavailableRef.current = true;
        setRequestError(null);
        return getBrowserFallbackTranscript();
      }

      throw error;
    } finally {
      isLiveTranscriptionInFlightRef.current = false;
      setIsTranscribingVoice(false);
    }
  };

  const scheduleLiveTranscription = () => {
    if (
      liveTranscriptionTimeoutRef.current !== null ||
      mediaRecorderRef.current?.state !== 'recording' ||
      audioChunksRef.current.length === 0
    ) {
      return;
    }

    liveTranscriptionTimeoutRef.current = window.setTimeout(() => {
      liveTranscriptionTimeoutRef.current = null;
      const sessionId = captureSessionIdRef.current;

      void transcribeCapturedAudio(sessionId).catch((error) => {
        if (sessionId !== captureSessionIdRef.current) {
          return;
        }

        setRequestError(formatRequestError(error));
      });
    }, LIVE_TRANSCRIPTION_INTERVAL_MS);
  };

  const startAudioMonitoring = async (stream: MediaStream) => {
    if (typeof AudioContext === 'undefined') {
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    audioSourceRef.current = source;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const updateMicLevel = () => {
      const currentAnalyser = analyserRef.current;
      if (!currentAnalyser) {
        return;
      }

      const now = performance.now();
      if (now - lastMicLevelSampleAtRef.current < 120) {
        animationFrameRef.current = window.requestAnimationFrame(updateMicLevel);
        return;
      }
      lastMicLevelSampleAtRef.current = now;

      currentAnalyser.getByteFrequencyData(frequencyData);
      const averageLevel =
        frequencyData.reduce((sum, value) => sum + value, 0) /
        frequencyData.length;
      const normalizedLevel = Math.max(0.06, Math.min(1, averageLevel / 110));

      setMicLevel(normalizedLevel);

      if (averageLevel > 18) {
        hasDetectedSpeechRef.current = true;

        if (silenceTimeoutRef.current !== null) {
          window.clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else if (hasDetectedSpeechRef.current && silenceTimeoutRef.current === null) {
        scheduleSilenceTimeout();
      }

      animationFrameRef.current = window.requestAnimationFrame(updateMicLevel);
    };

    updateMicLevel();
  };

  const stopRecording = (finalizeCapture: boolean) => {
    shouldFinalizeCaptureRef.current = finalizeCapture;
    stopBrowserRecognition(false);
    clearRecordingTimers();
    setIsPreparingRecording(false);
    setIsRecording(false);

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) {
      stopAudioMonitoring();
      return;
    }

    if (mediaRecorder.state === 'inactive') {
      mediaRecorderRef.current = null;
      stopAudioMonitoring();
      return;
    }

    try {
      mediaRecorder.stop();
    } catch {
      mediaRecorderRef.current = null;
      stopAudioMonitoring();
    }
  };

  const discardRecording = () => {
    shouldFinalizeCaptureRef.current = false;
    stopBrowserRecognition(true);
    clearRecordingTimers();
    captureSessionIdRef.current += 1;

    const mediaRecorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {
        // Ignore browser cleanup errors when the modal closes quickly.
      }
    }

    stopAudioMonitoring();
  };

  const handleConfirm = async (resultToConfirm = processResult) => {
    const parsedData = resultToConfirm?.parsedData;
    if (!parsedData) {
      return;
    }

    try {
      clearFeedback();

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

  const handleProcessedResult = async (processed: ProcessTextResult) => {
    setProcessResult(processed);
    setTranscript(processed.rawInput);

    if (!processed.parsedData) {
      return;
    }

    if (processed.parsedData.confirmation) {
      return;
    }

    await handleConfirm(processed);
  };

  const handleProcessTranscript = async () => {
    const nextTranscript = normalizeVoiceTranscriptForProcessing(transcript);

    if (!nextTranscript) {
      setRequestError(
        t('smartAdd.voiceEmpty', {
          defaultValue:
            'We could not hear a clear instruction. Please try again.',
        }),
      );
      return;
    }

    try {
      clearFeedback();
      setProcessResult(null);
      setTranscript(nextTranscript);
      latestTranscriptRef.current = nextTranscript;

      const processed = await processText({ text: nextTranscript });
      await handleProcessedResult(processed);
    } catch (error) {
      setRequestError(formatRequestError(error));
    }
  };

  const handleClarificationChoice = async (
    option: SmartAssistClarificationOption,
  ) => {
    try {
      clearFeedback();
      setTranscript(option.prompt);
      const processed = await processText({ text: option.prompt });
      await handleProcessedResult(processed);
    } catch (error) {
      setRequestError(formatRequestError(error));
    }
  };

  const handleTranscriptChange = (value: string) => {
    setTranscript(value);
    latestTranscriptRef.current = value;
    setProcessResult(null);
    clearFeedback();
  };

  const handleStartRecording = async () => {
    if (!supportsVoiceCapture) {
      setRequestError(
        t('smartAdd.voiceUnsupported', {
          defaultValue:
            'Voice recording is not supported in this browser. Please try a different one.',
        }),
      );
      return;
    }

    discardRecording();
    resetCaptureState();
    clearFeedback();
    setProcessResult(null);
    setTranscript('');
    setIsPreparingRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredRecordingMimeType();
      const sessionId = captureSessionIdRef.current + 1;
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      captureSessionIdRef.current = sessionId;
      mediaStreamRef.current = stream;
      recordingMimeTypeRef.current = mimeType;
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      lastTranscribedChunkCountRef.current = 0;

      await startAudioMonitoring(stream);
      if (supportsBrowserRecognition) {
        startBrowserRecognition();
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size <= 0) {
          return;
        }

        audioChunksRef.current.push(event.data);

        if (isRecording) {
          scheduleLiveTranscription();
        }
      };

      mediaRecorder.onerror = () => {
        shouldFinalizeCaptureRef.current = false;
        setRequestError(
          t('smartAdd.voiceStartFailed', {
            defaultValue:
              'Unable to start voice recording right now. Please try again.',
          }),
        );
      };

      mediaRecorder.onstop = () => {
        const shouldFinalizeCapture = shouldFinalizeCaptureRef.current;
        mediaRecorderRef.current = null;
        clearRecordingTimers();
        setIsPreparingRecording(false);
        setIsRecording(false);

        if (!shouldFinalizeCapture) {
          stopAudioMonitoring();
          return;
        }

        void (async () => {
          try {
            const nextTranscript = await transcribeCapturedAudio(sessionId, true);

            if (!nextTranscript) {
              setRequestError(
                t('smartAdd.voiceEmpty', {
                  defaultValue:
                    'We could not hear a clear instruction. Please try again.',
                }),
              );
            }
          } catch (error) {
            if (sessionId === captureSessionIdRef.current) {
              setRequestError(formatRequestError(error));
            }
          } finally {
            stopAudioMonitoring();
          }
        })();
      };

      mediaRecorder.start(AUDIO_CHUNK_TIMESLICE_MS);
      setIsPreparingRecording(false);
      setIsRecording(true);

      recordingTimeoutRef.current = window.setTimeout(() => {
        stopRecording(true);
      }, MAX_RECORDING_MS);

      scheduleSilenceTimeout();
    } catch (error) {
      discardRecording();
      setIsPreparingRecording(false);
      setIsRecording(false);
      setRequestError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? t('smartAdd.voicePermissionDenied', {
              defaultValue:
                'Microphone access was blocked. Please allow microphone access and try again.',
            })
          : t('smartAdd.voiceStartFailed', {
              defaultValue:
                'Unable to start voice recording right now. Please try again.',
            }),
      );
    }
  };

  const handleClose = () => {
    if (requiresConfirmation) {
      return;
    }

    discardRecording();
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

  useEffect(() => {
    if (!open) {
      discardRecording();
      resetModalState();
      return;
    }

    void handleStartRecording();

    return () => {
      discardRecording();
    };
  }, [open]);

  const statusText = useMemo(() => {
    if (isProcessingText) {
      return t('smartAdd.voiceProcessing', {
        defaultValue: 'Sending transcript to Smart Text Add...',
      });
    }

    if (isPreparingRecording) {
      return t('smartAdd.voicePreparing', {
        defaultValue: 'Starting microphone...',
      });
    }

    if (isRecording) {
      return transcript
        ? t('smartAdd.voiceListeningLive', {
            defaultValue: 'Listening...',
          })
        : t('smartAdd.voiceListeningPrompt', {
            defaultValue: 'Listening... Start speaking now.',
          });
    }

    if (isTranscribingVoice || isTranscribingMutation) {
      return t('smartAdd.voiceTranscribing', {
        defaultValue: 'Transcribing your voice...',
      });
    }

    if (transcript) {
      return t('smartAdd.voiceReview', {
        defaultValue:
          'Review the transcript, make quick edits if needed, then continue.',
      });
    }

    return t('smartAdd.voiceReady', {
      defaultValue: 'Voice Add starts listening automatically.',
    });
  }, [
    isPreparingRecording,
    isProcessingText,
    isRecording,
    isTranscribingMutation,
    isTranscribingVoice,
    t,
    transcript,
  ]);

  const voiceModeLabel = isProcessingText
    ? t('smartAdd.voiceModeProcessing', {
        defaultValue: 'Processing',
      })
    : isRecording
      ? t('smartAdd.voiceModeListening', {
          defaultValue: 'Listening',
        })
      : isTranscribingVoice || isTranscribingMutation
        ? t('smartAdd.voiceModeTranscribing', {
            defaultValue: 'Transcribing',
          })
      : transcript
        ? t('smartAdd.voiceModeReview', {
            defaultValue: 'Review Transcript',
          })
        : t('smartAdd.voiceModeReady', {
            defaultValue: 'Ready',
          });

  const canProcessTranscript =
    transcript.trim().length > 0 &&
    !isRecording &&
    !isPreparingRecording &&
    !isProcessing &&
    !isConfirming;

  const showTranscriptEditor =
    isRecording ||
    isPreparingRecording ||
    transcript.trim().length > 0 ||
    Boolean(requestError || persistError || processResult);

  return (
    <>
      <Modal open={open} onClose={handleClose}>
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
            <CancelButton onClick={handleClose}>
              <Close />
            </CancelButton>

            <SmartAssistContent sx={{ gap: 1.25, paddingTop: 2.25 }}>
              <Typography variant="h4" sx={{ mb: 0 }}>
                {t('smartAdd.voiceTitle', { defaultValue: 'Voice Add' })}
              </Typography>

              {!supportsVoiceCapture && (
                <Alert severity="warning">
                  {t('smartAdd.voiceUnsupported', {
                    defaultValue:
                      'Voice recording is not supported in this browser. Please try a different one.',
                  })}
                </Alert>
              )}

              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.9,
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 1.25, sm: 1.75 },
                  borderRadius: 4,
                  background:
                    `radial-gradient(circle at top, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(theme.palette.primary.main, 0.03)} 42%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  boxShadow: `0 16px 34px ${alpha(theme.palette.common.black, 0.07)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 'auto -20% -45% auto',
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background:
                      `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.main, 0)})`,
                    pointerEvents: 'none',
                  },
                  '@keyframes voiceOrbPulse': {
                    '0%': {
                      transform: 'scale(0.96)',
                      opacity: 0.55,
                    },
                    '50%': {
                      transform: 'scale(1.06)',
                      opacity: 0.95,
                    },
                    '100%': {
                      transform: 'scale(0.96)',
                      opacity: 0.55,
                    },
                  },
                  '@keyframes voiceWaveRise': {
                    '0%, 100%': {
                      transform: 'scaleY(0.72)',
                    },
                    '50%': {
                      transform: 'scaleY(1.08)',
                    },
                  },
                })}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={(theme) => ({
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '999px',
                    backgroundColor: alpha(
                      theme.palette.background.paper,
                      0.82,
                    ),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.06)}`,
                    zIndex: 1,
                  })}
                >
                  <GraphicEqRounded
                    sx={{
                      color: isRecording ? 'primary.main' : 'text.secondary',
                      fontSize: 18,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isRecording ? 'primary.main' : 'text.secondary',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {voiceModeLabel}
                  </Typography>
                </Stack>

                <Box
                  sx={(theme) => ({
                    position: 'relative',
                    width: { xs: 84, sm: 104 },
                    height: { xs: 84, sm: 104 },
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 1,
                    [theme.breakpoints.down('sm')]: {
                      width: 84,
                      height: 84,
                    },
                  })}
                >
                  <Box
                    sx={(theme) => ({
                      position: 'absolute',
                      inset: 8,
                      borderRadius: '50%',
                      background:
                        `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.primary.main, 0.02)} 72%)`,
                      animation: isRecording
                        ? 'voiceOrbPulse 1800ms ease-in-out infinite'
                        : 'none',
                    })}
                  />
                  <Box
                    sx={(theme) => ({
                      position: 'absolute',
                      inset: 16,
                      borderRadius: '50%',
                      background:
                        `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.main, 0)} 74%)`,
                      animation: isRecording
                        ? 'voiceOrbPulse 1800ms ease-in-out 220ms infinite'
                        : 'none',
                    })}
                  />
                  <Box
                    sx={(theme) => ({
                      width: { xs: 60, sm: 68 },
                      height: { xs: 60, sm: 68 },
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: isRecording
                        ? `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                        : `linear-gradient(180deg, ${theme.palette.grey[50]} 0%, ${alpha(theme.palette.primary.light, 0.18)} 100%)`,
                      color: isRecording
                        ? theme.palette.primary.contrastText
                        : theme.palette.primary.main,
                      boxShadow: isRecording
                        ? `0 18px 40px ${alpha(theme.palette.primary.main, 0.28)}`
                        : `0 12px 28px ${alpha(theme.palette.common.black, 0.08)}`,
                      transition:
                        'background 180ms ease, color 180ms ease, box-shadow 180ms ease',
                    })}
                  >
                    <KeyboardVoiceRounded sx={{ fontSize: 30 }} />
                  </Box>
                </Box>

                <Stack
                  direction="row"
                  spacing={0.6}
                  alignItems="flex-end"
                  justifyContent="center"
                  sx={{ minHeight: 32, zIndex: 1 }}
                >
                  {Array.from({ length: 12 }, (_, index) => {
                    const threshold = (index + 1) / 12;
                    const isActive = micLevel >= threshold;

                    return (
                      <Box
                        key={`hero-mic-bar-${index}`}
                        sx={(theme) => ({
                          width: 5,
                          height: 8 + index * 2,
                          borderRadius: '999px',
                          backgroundColor: isActive
                            ? 'primary.main'
                            : alpha(theme.palette.primary.main, 0.12),
                          opacity: isActive ? 1 : 0.7,
                          transformOrigin: 'bottom center',
                          animation: isRecording
                            ? `voiceWaveRise ${900 + index * 60}ms ease-in-out infinite`
                            : 'none',
                          transition:
                            'background-color 120ms ease, opacity 120ms ease',
                        })}
                      />
                    );
                  })}
                </Stack>

                <Typography
                  variant="body1"
                  sx={{
                    zIndex: 1,
                    fontWeight: 500,
                    maxWidth: 420,
                  }}
                >
                  {statusText}
                </Typography>
              </Box>

              {requestError && <Alert severity="error">{requestError}</Alert>}

              {showTranscriptEditor && (
                <Box
                  sx={(theme) => ({
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.background.paper, 0.96),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    boxShadow: `0 14px 34px ${alpha(theme.palette.common.black, 0.05)}`,
                    px: { xs: 1.5, sm: 2.25 },
                    py: { xs: 1.25, sm: 1.5 },
                  })}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600 }}
                    >
                      {t('smartAdd.voiceTranscript', {
                        defaultValue: 'Transcript',
                      })}
                    </Typography>
                    {transcript && (
                    <Typography
                      variant="caption"
                      sx={(theme) => ({
                          px: 1.2,
                          py: 0.45,
                          borderRadius: '999px',
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.08,
                          ),
                          color: 'primary.main',
                          fontWeight: 600,
                        })}
                      >
                        {t('smartAdd.voiceTranscriptEditable', {
                          defaultValue: 'Editable',
                        })}
                      </Typography>
                    )}
                  </Stack>
                  <CustomTextField
                    placeholder={t('smartAdd.voiceTranscriptPlaceholder', {
                      defaultValue:
                        'Your voice transcript will appear here after recording.',
                    })}
                    value={transcript}
                    multiline
                    minRows={isRecording || isPreparingRecording ? 1 : 2}
                    onChange={(event) => handleTranscriptChange(event.target.value)}
                  />
                </Box>
              )}

              {!showTranscriptEditor && (
                <Box
                  sx={(theme) => ({
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.background.paper, 0.96),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1.1, sm: 1.25 },
                  })}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    {t('smartAdd.voiceTranscript', {
                      defaultValue: 'Transcript',
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('smartAdd.voiceTranscriptPlaceholder', {
                      defaultValue:
                        'Your voice transcript will appear here after recording.',
                    })}
                  </Typography>
                </Box>
              )}

              {processResult?.fallbackToLLM && clarificationOptions.length > 0 && (
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

              <SmartAssistActionRow
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(3, minmax(0, 1fr))',
                  },
                  width: '100%',
                  gap: 1.25,
                }}
              >
                <SmartAssistSecondaryButton
                  variant="outlined"
                  onClick={handleClose}
                  disabled={isProcessing || isConfirming}
                  sx={{ width: '100%', minWidth: 0 }}
                >
                  {t('modal.cancel', { defaultValue: 'Cancel' })}
                </SmartAssistSecondaryButton>

                {isRecording ? (
                  <SmartAssistSecondaryButton
                    variant="outlined"
                    startIcon={<StopRounded />}
                    onClick={() => stopRecording(true)}
                    disabled={isProcessing || isConfirming}
                    sx={{ width: '100%', minWidth: 0 }}
                  >
                    {t('smartAdd.voiceStop', {
                      defaultValue: 'Stop',
                    })}
                  </SmartAssistSecondaryButton>
                ) : (
                  <SmartAssistSecondaryButton
                    variant="outlined"
                    startIcon={<ReplayRounded />}
                    onClick={handleStartRecording}
                    disabled={
                      !supportsVoiceCapture ||
                      isPreparingRecording ||
                      isProcessing ||
                      isConfirming
                    }
                    sx={{ width: '100%', minWidth: 0 }}
                  >
                    {t('smartAdd.voiceRetry', {
                      defaultValue: 'Retry',
                    })}
                  </SmartAssistSecondaryButton>
                )}

                <SmartAssistPrimaryButton
                  variant="contained"
                  startIcon={<Check />}
                  onClick={handleProcessTranscript}
                  disabled={!canProcessTranscript}
                  sx={{ width: '100%', minWidth: 0 }}
                >
                  {isProcessing
                    ? t('smartAdd.voiceProcessingShort', {
                        defaultValue: 'Processing...',
                      })
                    : t('modal.save', {
                        defaultValue: 'Save',
                      })}
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

export default SmartAssistVoiceModal;
