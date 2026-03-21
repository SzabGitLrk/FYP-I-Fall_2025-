export class ConfirmAiResultResponseDto {
  persisted!: boolean;
  message!: string;
  storageId?: string | null;
  boxIds?: Record<string, string>;
  itemIds?: string[];
  warnings?: string[];
}
