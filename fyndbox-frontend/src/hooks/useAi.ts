import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  confirmAiResult,
  processTextInput,
  processVoiceInput,
} from '../api/aiService';
import {
  ConfirmAiResult,
  ConfirmAiResultRequest,
  ProcessTextRequest,
  ProcessTextResult,
  ProcessVoiceResult,
} from '../types/ai';

// Process AI text input
export const useProcessTextInput = () => {
  return useMutation<ProcessTextResult, Error, ProcessTextRequest>({
    mutationFn: (payload) => processTextInput(payload),
    onError: (error: Error) => {
      console.error('Error processing text input', error);
    },
  });
};

// Process AI voice input
export const useProcessVoiceInput = () => {
  return useMutation<ProcessVoiceResult, Error, File>({
    mutationFn: (file) => processVoiceInput(file),
    onError: (error: Error) => {
      console.error('Error processing voice input', error);
    },
  });
};

// Confirm AI result
export const useConfirmAiResult = () => {
  const queryClient = useQueryClient();

  return useMutation<ConfirmAiResult, Error, ConfirmAiResultRequest>({
    mutationFn: (payload) => confirmAiResult(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storages'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteBoxes'] });
    },
    onError: (error: Error) => {
      console.error('Error confirming AI result', error);
    },
  });
};
