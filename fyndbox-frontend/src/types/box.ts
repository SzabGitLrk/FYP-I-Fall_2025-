import { Item } from './item';

export interface Box {
  id: string;
  name: string;
  description?: string;
  image?: string;
  storageId?: string;
  isFavorite?: boolean;
  items?: Item[];
}
