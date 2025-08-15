import { TransactionType, BudgetPeriod, FamilyRole, ItemPriority } from '@prisma/client';

/**
 * Validation utility functions for FinTrack application
 */

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }

  // Optional: Add more password requirements
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return { valid: true };
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Validate monetary amount
 */
export function isValidAmount(amount: number): { valid: boolean; message?: string } {
  if (isNaN(amount)) {
    return { valid: false, message: 'Amount must be a number' };
  }

  if (amount < 0) {
    return { valid: false, message: 'Amount cannot be negative' };
  }

  if (amount > 999999999.99) {
    return { valid: false, message: 'Amount is too large' };
  }

  // Check for too many decimal places (cents precision)
  const decimals = amount.toString().split('.')[1];
  if (decimals && decimals.length > 2) {
    return { valid: false, message: 'Amount cannot have more than 2 decimal places' };
  }

  return { valid: true };
}

/**
 * Validate transaction type
 */
export function isValidTransactionType(type: string): type is TransactionType {
  return Object.values(TransactionType).includes(type as TransactionType);
}

/**
 * Validate budget period
 */
export function isValidBudgetPeriod(period: string): period is BudgetPeriod {
  return Object.values(BudgetPeriod).includes(period as BudgetPeriod);
}

/**
 * Validate family role
 */
export function isValidFamilyRole(role: string): role is FamilyRole {
  return Object.values(FamilyRole).includes(role as FamilyRole);
}

/**
 * Validate item priority
 */
export function isValidItemPriority(priority: string): priority is ItemPriority {
  return Object.values(ItemPriority).includes(priority as ItemPriority);
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: Date, endDate: Date): { valid: boolean; message?: string } {
  if (startDate >= endDate) {
    return { valid: false, message: 'End date must be after start date' };
  }

  const now = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(now.getFullYear() + 10);

  if (endDate > maxFutureDate) {
    return { valid: false, message: 'End date cannot be more than 10 years in the future' };
  }

  const minPastDate = new Date();
  minPastDate.setFullYear(now.getFullYear() - 50);

  if (startDate < minPastDate) {
    return { valid: false, message: 'Start date cannot be more than 50 years in the past' };
  }

  return { valid: true };
}

/**
 * Validate string length
 */
export function isValidStringLength(
  value: string,
  minLength: number = 0,
  maxLength: number = 255
): { valid: boolean; message?: string } {
  const trimmedValue = value.trim();

  if (trimmedValue.length < minLength) {
    return { valid: false, message: `Value must be at least ${minLength} characters long` };
  }

  if (trimmedValue.length > maxLength) {
    return { valid: false, message: `Value must be less than ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(percentage: number): { valid: boolean; message?: string } {
  if (isNaN(percentage)) {
    return { valid: false, message: 'Percentage must be a number' };
  }

  if (percentage < 0 || percentage > 100) {
    return { valid: false, message: 'Percentage must be between 0 and 100' };
  }

  return { valid: true };
}

/**
 * Validate array of percentages sum to 100
 */
export function isValidPercentageSplit(percentages: number[]): { valid: boolean; message?: string } {
  const sum = percentages.reduce((acc, pct) => acc + pct, 0);
  
  if (Math.abs(sum - 100) > 0.01) { // Allow for small floating point errors
    return { valid: false, message: 'Percentages must sum to 100%' };
  }

  return { valid: true };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validate and sanitize category name
 */
export function validateCategoryName(name: string): { valid: boolean; sanitized?: string; message?: string } {
  const sanitized = sanitizeString(name);
  
  const lengthValidation = isValidStringLength(sanitized, 1, 50);
  if (!lengthValidation.valid) {
    return { valid: false, message: lengthValidation.message };
  }

  // Additional category name rules
  if (!/^[a-zA-Z0-9\s&-]+$/.test(sanitized)) {
    return { valid: false, message: 'Category name can only contain letters, numbers, spaces, & and -' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate transaction description
 */
export function validateTransactionDescription(description: string): { valid: boolean; sanitized?: string; message?: string } {
  const sanitized = sanitizeString(description);
  
  const lengthValidation = isValidStringLength(sanitized, 1, 200);
  if (!lengthValidation.valid) {
    return { valid: false, message: lengthValidation.message };
  }

  return { valid: true, sanitized };
}

/**
 * Validate family permissions array
 */
export function validateFamilyPermissions(permissions: string[]): { valid: boolean; message?: string } {
  const validPermissions = [
    'VIEW',
    'ADD_TRANSACTIONS',
    'EDIT_TRANSACTIONS',
    'DELETE_TRANSACTIONS',
    'MANAGE_BUDGETS',
    'MANAGE_SHOPPING_LISTS',
    'MANAGE_MEMBERS',
    'VIEW_REPORTS',
  ];

  for (const permission of permissions) {
    if (!validPermissions.includes(permission)) {
      return { valid: false, message: `Invalid permission: ${permission}` };
    }
  }

  // Remove duplicates
  const uniquePermissions = [...new Set(permissions)];
  if (uniquePermissions.length !== permissions.length) {
    return { valid: false, message: 'Permissions array contains duplicates' };
  }

  return { valid: true };
}