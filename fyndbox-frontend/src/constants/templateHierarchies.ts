import { TemplateHierarchyStorage } from '../types/templateHierarchy';

export const TEMPLATE_HIERARCHIES: TemplateHierarchyStorage[] = [
  {
    storageName: 'Library',
    boxes: [
      {
        name: 'Fiction',
        items: [
          { name: 'Novels', quantity: 0 },
          { name: 'Short Stories', quantity: 0 },
          { name: 'Thrillers', quantity: 0 },
          { name: 'Science Fiction', quantity: 0 },
          { name: 'Fantasy', quantity: 0 },
        ],
      },
      {
        name: 'Literature & Arts',
        items: [
          { name: 'Poetry', quantity: 0 },
          { name: 'Drama & Plays', quantity: 0 },
          { name: 'Classic Literature', quantity: 0 },
          { name: 'Essays', quantity: 0 },
        ],
      },
      {
        name: 'Visual & Graphic',
        items: [
          { name: 'Comics', quantity: 0 },
          { name: 'Graphic Novels', quantity: 0 },
          { name: 'Manga', quantity: 0 },
          { name: 'Art Books', quantity: 0 },
        ],
      },
      {
        name: 'Non-Fiction',
        items: [
          { name: 'History', quantity: 0 },
          { name: 'Science', quantity: 0 },
          { name: 'Biographies', quantity: 0 },
          { name: 'Memoirs', quantity: 0 },
          { name: 'Philosophy', quantity: 0 },
          { name: 'Self-Help', quantity: 0 },
        ],
      },
      {
        name: 'Reference',
        items: [
          { name: 'Dictionaries', quantity: 0 },
          { name: 'Encyclopedias', quantity: 0 },
          { name: 'Maps & Atlases', quantity: 0 },
          { name: 'Textbooks', quantity: 0 },
          { name: 'Research Papers', quantity: 0 },
        ],
      },
      {
        name: 'Periodicals',
        items: [
          { name: 'Journals', quantity: 0 },
          { name: 'Magazines', quantity: 0 },
          { name: 'Newspapers', quantity: 0 },
        ],
      },
    ],
  },
];