// src/constants/categories.ts
import { ExpenseCategory } from '../types';
import { TranslationKey } from './translations';

export interface CategoryDef {
  key: ExpenseCategory;
  label: string;
  labelKey: TranslationKey;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'pagkain',  label: 'Pagkain',   labelKey: 'catPagkain',  emoji: '🍚', color: '#E24B4A' },
  { key: 'pamasahe', label: 'Pamasahe',  labelKey: 'catPamasahe', emoji: '🚌', color: '#378ADD' },
  { key: 'supplies', label: 'Supplies',  labelKey: 'catSupplies', emoji: '📚', color: '#EF9F27' },
  { key: 'load',     label: 'Load/Data', labelKey: 'catLoad',     emoji: '📱', color: '#1D9E75' },
  { key: 'libre',    label: 'Libre',     labelKey: 'catLibre',    emoji: '🤝', color: '#D4537E' },
  { key: 'iba_pa',   label: 'Iba pa',    labelKey: 'catIbaPa',    emoji: '📦', color: '#888780' },
];
