import { ApiResponse } from '@fyndbox/shared/types/api-response';
import apiClient from './apiClient';
import {
  SmartAddParsedData,
  SmartAddPersistPayload,
  SmartAddProcessPayload,
} from '../types/textProcessing';

export const processTextInstruction = async (
  text: string,
): Promise<ApiResponse<SmartAddProcessPayload>> => {
  const response = await apiClient.post<ApiResponse<SmartAddProcessPayload>>(
    '/text-process',
    { text },
  );

  return response.data;
};

export const confirmTextInstruction = async (
  parsedData: SmartAddParsedData,
): Promise<ApiResponse<SmartAddPersistPayload>> => {
  const response = await apiClient.post<ApiResponse<SmartAddPersistPayload>>(
    '/text-process/confirm',
    { parsedData },
  );

  return response.data;
};
