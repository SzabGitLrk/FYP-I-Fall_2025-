import apiClient from './apiClient';
import { handleApiCall } from '../utils/handleApiCall';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import {
  ConfirmAiResult,
  ConfirmAiResultRequest,
  ProcessTextRequest,
  ProcessTextResult,
  ProcessVoiceResult,
} from '../types/ai';

export const processTextInput = (
  payload: ProcessTextRequest,
): Promise<ProcessTextResult> => {
  return handleApiCall(
    apiClient.post<ApiResponse<ProcessTextResult>>('/ai/process-text', payload),
  );
};

export const processVoiceInput = (
  file: File,
): Promise<ProcessVoiceResult> => {
  const formData = new FormData();
  formData.append('file', file);

  return handleApiCall(
    apiClient.post<ApiResponse<ProcessVoiceResult>>(
      '/ai/transcribe-voice',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    ),
  );
};

export const confirmAiResult = (
  payload: ConfirmAiResultRequest,
): Promise<ConfirmAiResult> => {
  return handleApiCall(
    apiClient.post<ApiResponse<ConfirmAiResult>>('/ai/confirm', payload),
  );
};
