import { ApiResponse } from '@fyndbox/shared';
import { handleApiCall } from '../utils/handleApiCall';
import apiClient from './apiClient';

export const uploadImage = async (
  file: File,
): Promise<{ imageUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    console.log('FormData prepared for upload:', {
      fieldName: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
      '/images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    console.log('Image upload response:', response);
    return handleApiCall(Promise.resolve(response));
  } catch (error) {
    console.error('Image upload error:', {
      error,
      status: (error as any)?.response?.status,
      statusText: (error as any)?.response?.statusText,
      data: (error as any)?.response?.data,
      message: (error as any)?.message,
    });
    throw error;
  }
};

export const deleteImage = async (key: string): Promise<void> => {
  return handleApiCall(
    apiClient.delete<ApiResponse<void>>('/images/delete', {
      data: { key },
    }),
  );
};
