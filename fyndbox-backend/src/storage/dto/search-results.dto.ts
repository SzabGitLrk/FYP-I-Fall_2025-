export class SearchResultItemDto {
  id: string;
  name: string;
  description?: string;
  image?: string;
  boxId: string;
  boxName: string;
  storageId: string;
  storageName: string;
}

export class SearchResultBoxDto {
  id: string;
  name: string;
  description?: string;
  image?: string;
  itemCount: number;
  storageId: string;
  storageName: string;
}

export class SearchResultStorageDto {
  id: string;
  name: string;
  description?: string;
  image?: string;
  boxCount: number;
  itemCount: number;
}

export class SearchResultsDto {
  items: SearchResultItemDto[];
  boxes: SearchResultBoxDto[];
  storages: SearchResultStorageDto[];
  keyword: string;
  totalResults: number;
}
