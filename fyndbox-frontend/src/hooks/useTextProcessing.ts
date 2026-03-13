import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import {
  confirmTextInstruction,
  processTextInstruction,
} from '../api/textProcessingService';
import {
  SmartAddParsedData,
  SmartAddPersistPayload,
  SmartAddProcessPayload,
} from '../types/textProcessing';

export const useProcessTextInstruction = () => {
  return useMutation<ApiResponse<SmartAddProcessPayload>, Error, string>({
    mutationFn: (text: string) => processTextInstruction(text),
  });
};

export const useConfirmTextInstruction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<SmartAddPersistPayload>,
    Error,
    SmartAddParsedData
  >({
    mutationFn: (parsedData: SmartAddParsedData) =>
      confirmTextInstruction(parsedData),
    onSuccess: (response) => {
      if (!response.success) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['storages'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteBoxes'] });
    },
  });
};
