// src/constants/categories.ts
import { ExpenseCategory } from '../types';

export interface CategoryDef {
  key: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'pagkain',  label: 'Pagkain',   emoji: '🍚', color: '#E24B4A' },
  { key: 'pamasahe', label: 'Pamasahe',  emoji: '🚌', color: '#378ADD' },
  { key: 'supplies', label: 'Supplies',  emoji: '📚', color: '#EF9F27' },
  { key: 'load',     label: 'Load/Data', emoji: '📱', color: '#1D9E75' },
  { key: 'libre',    label: 'Libre',     emoji: '🤝', color: '#D4537E' },
  { key: 'iba_pa',   label: 'Iba pa',    emoji: '📦', color: '#888780' },
];
