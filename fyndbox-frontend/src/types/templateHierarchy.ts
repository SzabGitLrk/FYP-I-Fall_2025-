export interface TemplateHierarchyItem {
  name: string;
  quantity: number;
}

export interface TemplateHierarchyBox {
  items: TemplateHierarchyItem[];
  name: string;
}

export interface TemplateHierarchyStorage {
  boxes: TemplateHierarchyBox[];
  storageName: string;
}

export interface TemplateSelectionItem {
  name: string;
}

export interface TemplateSelectionBox {
  items: TemplateSelectionItem[];
  name: string;
}

export interface TemplateSelectionStorage {
  boxes: TemplateSelectionBox[];
  storageName: string;
}
