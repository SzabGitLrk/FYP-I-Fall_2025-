import apiClient from './apiClient';
import { handleApiCall } from '../utils/handleApiCall';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import {
  ConfirmAiResult,
  ConfirmAiResultRequest,
  ProcessTextRequest,
  ProcessTextResult,
} from '../types/ai';

export const processTextInput = (
  payload: ProcessTextRequest,
): Promise<ProcessTextResult> => {
  return handleApiCall(
    apiClient.post<ApiResponse<ProcessTextResult>>('/ai/process-text', payload),
  );
};

export const confirmAiResult = (
  payload: ConfirmAiResultRequest,
): Promise<ConfirmAiResult> => {
  return handleApiCall(
    apiClient.post<ApiResponse<ConfirmAiResult>>('/ai/confirm', payload),
  );
};
