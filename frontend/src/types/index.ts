/**
 * Core type definitions for FinTrack application
 * These types should match the GraphQL schema
 */

// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
  categoryId: string;
  category?: Category;
  userId: string;
  user?: User;
  familyId?: string;
  family?: Family;
  splits?: TransactionSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSplit {
  id: string;
  transactionId: string;
  userId: string;
  user?: User;
  amount: number;
  percentage: number;
  settled: boolean;
  settledAt?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type: 'income' | 'expense';
  userId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Budget types
export interface Budget {
  id: string;
  categoryId: string;
  category?: Category;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  userId: string;
  user?: User;
  familyId?: string;
  family?: Family;
  createdAt: string;
  updatedAt: string;
}

// Family types
export interface Family {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  creator?: User;
  members: FamilyMember[];
  transactions?: Transaction[];
  budgets?: Budget[];
  shoppingLists?: ShoppingList[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  user?: User;
  role: 'admin' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: string;
}

// Shopping List types
export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  userId: string;
  user?: User;
  familyId?: string;
  family?: Family;
  items: ShoppingListItem[];
  shared: boolean;
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  name: string;
  estimatedPrice: number;
  actualPrice?: number;
  categoryId?: string;
  category?: Category;
  priority: 'must-have' | 'nice-to-have' | 'optional';
  purchased: boolean;
  purchasedAt?: string;
  purchasedBy?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface MonthlySpending {
  month: string;
  year: number;
  income: number;
  expenses: number;
  net: number;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
}

// Form types
export interface TransactionFormData {
  amount: string;
  description: string;
  categoryId: string;
  date: string;
  type: 'income' | 'expense';
  splits?: {
    userId: string;
    percentage: number;
  }[];
}

export interface BudgetFormData {
  categoryId: string;
  amount: string;
  period: 'monthly' | 'yearly';
  startDate: string;
}

export interface ShoppingListFormData {
  name: string;
  description?: string;
  shared: boolean;
  sharedWith?: string[];
}

export interface ShoppingListItemFormData {
  name: string;
  estimatedPrice: string;
  categoryId?: string;
  priority: 'must-have' | 'nice-to-have' | 'optional';
}

// Filter types
export interface TransactionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  type?: 'income' | 'expense';
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface BudgetFilters {
  period?: 'monthly' | 'yearly';
  status?: 'good' | 'warning' | 'danger';
  categories?: string[];
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// Utility types
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface PaginationConfig {
  page: number;
  limit: number;
}

// Currency types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate to USD
}

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'budget_alert' | 'family_update' | 'expense_reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

// Export types
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv';
  dateRange: {
    start: string;
    end: string;
  };
  includeCategories: string[];
  includeBudgets: boolean;
  includeCharts: boolean;
  includeTransactions: boolean;
}