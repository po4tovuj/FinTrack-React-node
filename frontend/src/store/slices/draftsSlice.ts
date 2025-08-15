import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for draft data
 * Stores temporary form data and work-in-progress items
 */
interface DraftsState {
  // Transaction draft
  newTransaction: {
    amount: string;
    description: string;
    categoryId: string;
    date: string;
    type: 'income' | 'expense';
    splits?: Array<{
      userId: string;
      amount: string;
      percentage: number;
    }>;
  };

  // Budget draft
  newBudget: {
    categoryId: string;
    amount: string;
    period: 'monthly' | 'yearly';
    startDate: string;
  };

  // Shopping list draft
  shoppingList: {
    items: Array<{
      id: string;
      name: string;
      estimatedPrice: string;
      categoryId: string;
      priority: 'must-have' | 'nice-to-have' | 'optional';
    }>;
    isEditing: boolean;
    editingItemId?: string;
  };

  // Family invitation draft
  familyInvitation: {
    emails: string[];
    message: string;
    permissions: string[];
  };

  // Export settings draft
  exportSettings: {
    format: 'pdf' | 'excel' | 'csv';
    dateRange: {
      start: string;
      end: string;
    };
    includeCategories: string[];
    includeBudgets: boolean;
    includeCharts: boolean;
  };
}

const initialState: DraftsState = {
  newTransaction: {
    amount: '',
    description: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    splits: [],
  },
  newBudget: {
    categoryId: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
  },
  shoppingList: {
    items: [],
    isEditing: false,
  },
  familyInvitation: {
    emails: [],
    message: '',
    permissions: ['view', 'add-transactions'],
  },
  exportSettings: {
    format: 'pdf',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    includeCategories: [],
    includeBudgets: true,
    includeCharts: true,
  },
};

/**
 * Drafts slice for managing temporary form data and work-in-progress items
 * Used to preserve user input when switching between forms or pages
 */
const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    // Transaction draft management
    updateTransactionDraft: (state, action: PayloadAction<Partial<DraftsState['newTransaction']>>) => {
      state.newTransaction = { ...state.newTransaction, ...action.payload };
    },
    addTransactionSplit: (state, action: PayloadAction<{
      userId: string;
      amount: string;
      percentage: number;
    }>) => {
      state.newTransaction.splits = state.newTransaction.splits || [];
      state.newTransaction.splits.push(action.payload);
    },
    removeTransactionSplit: (state, action: PayloadAction<string>) => {
      if (state.newTransaction.splits) {
        state.newTransaction.splits = state.newTransaction.splits.filter(
          split => split.userId !== action.payload
        );
      }
    },
    clearTransactionDraft: (state) => {
      state.newTransaction = initialState.newTransaction;
    },

    // Budget draft management
    updateBudgetDraft: (state, action: PayloadAction<Partial<DraftsState['newBudget']>>) => {
      state.newBudget = { ...state.newBudget, ...action.payload };
    },
    clearBudgetDraft: (state) => {
      state.newBudget = initialState.newBudget;
    },

    // Shopping list draft management
    addShoppingListItem: (state, action: PayloadAction<{
      name: string;
      estimatedPrice: string;
      categoryId: string;
      priority: 'must-have' | 'nice-to-have' | 'optional';
    }>) => {
      const newItem = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.shoppingList.items.push(newItem);
    },
    updateShoppingListItem: (state, action: PayloadAction<{
      id: string;
      updates: Partial<DraftsState['shoppingList']['items'][0]>;
    }>) => {
      const itemIndex = state.shoppingList.items.findIndex(item => item.id === action.payload.id);
      if (itemIndex !== -1) {
        state.shoppingList.items[itemIndex] = {
          ...state.shoppingList.items[itemIndex],
          ...action.payload.updates,
        };
      }
    },
    removeShoppingListItem: (state, action: PayloadAction<string>) => {
      state.shoppingList.items = state.shoppingList.items.filter(
        item => item.id !== action.payload
      );
    },
    setShoppingListEditing: (state, action: PayloadAction<{ isEditing: boolean; itemId?: string }>) => {
      state.shoppingList.isEditing = action.payload.isEditing;
      state.shoppingList.editingItemId = action.payload.itemId;
    },
    clearShoppingListDraft: (state) => {
      state.shoppingList = initialState.shoppingList;
    },

    // Family invitation draft management
    updateFamilyInvitationDraft: (state, action: PayloadAction<Partial<DraftsState['familyInvitation']>>) => {
      state.familyInvitation = { ...state.familyInvitation, ...action.payload };
    },
    addInvitationEmail: (state, action: PayloadAction<string>) => {
      if (!state.familyInvitation.emails.includes(action.payload)) {
        state.familyInvitation.emails.push(action.payload);
      }
    },
    removeInvitationEmail: (state, action: PayloadAction<string>) => {
      state.familyInvitation.emails = state.familyInvitation.emails.filter(
        email => email !== action.payload
      );
    },
    clearFamilyInvitationDraft: (state) => {
      state.familyInvitation = initialState.familyInvitation;
    },

    // Export settings draft management
    updateExportSettingsDraft: (state, action: PayloadAction<Partial<DraftsState['exportSettings']>>) => {
      state.exportSettings = { ...state.exportSettings, ...action.payload };
    },
    toggleExportCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const index = state.exportSettings.includeCategories.indexOf(categoryId);
      if (index === -1) {
        state.exportSettings.includeCategories.push(categoryId);
      } else {
        state.exportSettings.includeCategories.splice(index, 1);
      }
    },
    clearExportSettingsDraft: (state) => {
      state.exportSettings = initialState.exportSettings;
    },

    // Clear all drafts
    clearAllDrafts: () => initialState,
  },
});

export const {
  updateTransactionDraft,
  addTransactionSplit,
  removeTransactionSplit,
  clearTransactionDraft,
  updateBudgetDraft,
  clearBudgetDraft,
  addShoppingListItem,
  updateShoppingListItem,
  removeShoppingListItem,
  setShoppingListEditing,
  clearShoppingListDraft,
  updateFamilyInvitationDraft,
  addInvitationEmail,
  removeInvitationEmail,
  clearFamilyInvitationDraft,
  updateExportSettingsDraft,
  toggleExportCategory,
  clearExportSettingsDraft,
  clearAllDrafts,
} = draftsSlice.actions;

export default draftsSlice.reducer;