export interface SearchResultItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  boxId: string;
  boxName: string;
  storageId: string;
  storageName: string;
}

export interface SearchResultBox {
  id: string;
  name: string;
  description?: string;
  image?: string;
  itemCount: number;
  storageId: string;
  storageName: string;
}

export interface SearchResultStorage {
  id: string;
  name: string;
  description?: string;
  image?: string;
  boxCount: number;
  itemCount: number;
}

export interface SearchResults {
  items: SearchResultItem[];
  boxes: SearchResultBox[];
  storages: SearchResultStorage[];
  keyword: string;
  totalResults: number;
}
