import apiClient from './apiClient';
import { handleApiCall } from '../utils/handleApiCall';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { Storage } from '../types/storage';

// Get all storages
export const getStorages = async (): Promise<Storage[]> => {
  return handleApiCall(apiClient.get<ApiResponse<Storage[]>>('/storages'));
};

// Get storage by ID
export const getStorageById = async (storageId: string): Promise<Storage> => {
  return handleApiCall(
    apiClient.get<ApiResponse<Storage>>(`/storages/${storageId}`),
  );
};

// Create a new storage
export const createStorage = async (
  storageData: Partial<Storage>,
): Promise<Storage> => {
  return handleApiCall(
    apiClient.post<ApiResponse<Storage>>('/storages', storageData),
  );
};

// Update a storage by ID
export const updateStorage = async (
  storageId: number,
  storageData: Partial<Storage>,
): Promise<Storage> => {
  return handleApiCall(
    apiClient.put<ApiResponse<Storage>>(`/storages/${storageId}`, storageData),
  );
};

// Delete a storage by ID
export const deleteStorage = async (storageId: number): Promise<void> => {
  return handleApiCall(
    apiClient.delete<ApiResponse<void>>(`/storages/${storageId}`),
  );
};

// Search storages by keyword
export const searchStorages = async (keyword: string): Promise<Storage[]> => {
  return handleApiCall(
    apiClient.get<ApiResponse<Storage[]>>(
      `/storages/search?keyword=${keyword}`,
    ),
  );
};

// Search storages with structured results
export const searchStoragesStructured = async (
  keyword: string,
): Promise<any> => {
  // Trim only when sending to API, not in the input field
  const trimmedKeyword = keyword.trim();
  return handleApiCall(
    apiClient.get<ApiResponse<any>>(
      `/storages/search-structured?keyword=${encodeURIComponent(trimmedKeyword)}`,
    ),
  );
};
